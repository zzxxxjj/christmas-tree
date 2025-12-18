import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_COLORS, PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS } from '../constants';

interface MagicTreeProps {
  explosionFactor: React.MutableRefObject<number>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const baseColor = new THREE.Color();

// Create a 5-pointed Star Shape
const createStarShape = () => {
  const shape = new THREE.Shape();
  const outerRadius = 1.0;
  const innerRadius = 0.4;
  const points = 5;
  
  for (let i = 0; i < points * 2; i++) {
    // Alternate between outer and inner radius
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = (i / (points * 2)) * Math.PI * 2;
    // Rotate to align top point
    const angle = a - Math.PI / 10; 
    
    const x = Math.sin(angle) * r;
    const y = Math.cos(angle) * r;
    
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

const starShape = createStarShape();

export const MagicTree: React.FC<MagicTreeProps> = ({ explosionFactor }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const starLightRef = useRef<THREE.PointLight>(null);
  
  // Generate particle data
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 1. Tree Formation Data (Simple Spiral Cone)
      const y = (i / PARTICLE_COUNT) * TREE_HEIGHT - (TREE_HEIGHT / 2); // Height from bottom to top
      const normalizedH = (y + TREE_HEIGHT / 2) / TREE_HEIGHT; // 0 to 1
      const radiusAtHeight = TREE_RADIUS * (1 - normalizedH); // Cone shape
      
      const angle = i * 0.5; // Spiral density
      const xTree = Math.cos(angle) * radiusAtHeight;
      const zTree = Math.sin(angle) * radiusAtHeight;

      // 2. Explosion Data (Random Sphere/Nebula)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = Math.pow(Math.random(), 1 / 3) * (TREE_HEIGHT * 1.5); // Random distribution in sphere
      
      const xExp = r * Math.sin(phi) * Math.cos(theta);
      const yExp = r * Math.sin(phi) * Math.sin(theta);
      const zExp = r * Math.cos(phi);

      // Random color assignment
      const colorHex = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)];

      data.push({
        tree: new THREE.Vector3(xTree, y, zTree),
        explosion: new THREE.Vector3(xExp, yExp, zExp),
        color: colorHex,
        scale: Math.random() * 0.15 + 0.05, // Random particle size
        // Twinkle properties
        blinkSpeed: 0.5 + Math.random() * 3, // Random blink speed
        blinkOffset: Math.random() * Math.PI * 2, // Random start phase
      });
    }
    return data;
  }, []);

  // Set initial colors and scales
  useLayoutEffect(() => {
    if (meshRef.current) {
      particles.forEach((p, i) => {
        tempColor.set(p.color);
        meshRef.current!.setColorAt(i, tempColor);
        
        tempObject.position.copy(p.tree);
        tempObject.scale.setScalar(p.scale);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  // Animation loop logic
  const animProgress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    // Rotate the entire tree group
    groupRef.current.rotation.y += delta * 0.3;

    // Smoothly interpolate animation progress towards the target factor
    // explosionFactor.current is either 0 (Tree) or 1 (Explode)
    const speed = 2.5; // Animation speed
    animProgress.current = THREE.MathUtils.lerp(animProgress.current, explosionFactor.current, delta * speed);

    const t = animProgress.current;
    const time = state.clock.getElapsedTime();

    // Update Particles
    particles.forEach((p, i) => {
      // Lerp Position
      const x = THREE.MathUtils.lerp(p.tree.x, p.explosion.x, t);
      const y = THREE.MathUtils.lerp(p.tree.y, p.explosion.y, t);
      const z = THREE.MathUtils.lerp(p.tree.z, p.explosion.z, t);

      // Floating noise
      const noise = Math.sin(time * 2 + i) * 0.05;

      tempObject.position.set(x, y + noise, z);
      tempObject.scale.setScalar(p.scale);
      
      // Rotate particles slightly
      tempObject.rotation.set(time * 0.1, time * 0.1, 0);
      
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);

      // Twinkle Effect Logic
      // Calculate a sine wave intensity: 0.2 to 1.2 (allows slightly brighter than base)
      const blink = Math.sin(time * p.blinkSpeed + p.blinkOffset);
      const intensity = 0.7 + (blink * 0.5); // Range ~ 0.2 to 1.2
      
      baseColor.set(p.color);
      // Multiply color by intensity
      tempColor.copy(baseColor).multiplyScalar(intensity);
      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Update Star Logic
    if (starRef.current) {
        // Scale Star: Large (1.5) when Tree (t=0), Small (0.15) when Exploded (t=1)
        const scale = THREE.MathUtils.lerp(1.5, 0.15, t);
        starRef.current.scale.setScalar(scale);
        
        // Spin Star
        starRef.current.rotation.y = time * 0.8;
        starRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    }

    // Update Star Light Intensity
    if (starLightRef.current) {
        // Dim the main star light when exploded so it doesn't overpower the nebula
        const intensity = THREE.MathUtils.lerp(2, 0.5, t);
        starLightRef.current.intensity = intensity;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial 
          toneMapped={false} 
          color="white"
        />
      </instancedMesh>
      
      {/* Top Star */}
      <mesh ref={starRef} position={[0, TREE_HEIGHT / 2 + 1, 0]}>
        {/* Extruded Star Shape */}
        <extrudeGeometry 
          args={[
            starShape, 
            { 
              depth: 0.4, 
              bevelEnabled: true, 
              bevelThickness: 0.1, 
              bevelSize: 0.1, 
              bevelSegments: 2 
            }
          ]} 
        />
        <meshBasicMaterial color="#FFD700" toneMapped={false} />
      </mesh>
      
      <pointLight 
        ref={starLightRef}
        position={[0, TREE_HEIGHT / 2, 0]} 
        intensity={2} 
        color="#FFD700" 
        distance={15} 
      />
    </group>
  );
};