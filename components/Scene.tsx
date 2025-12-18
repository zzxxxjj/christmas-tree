import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { MagicTree } from './MagicTree';

interface SceneProps {
  explosionFactorRef: React.MutableRefObject<number>;
}

export const Scene: React.FC<SceneProps> = ({ explosionFactorRef }) => {
  return (
    <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
      <color attach="background" args={['#050505']} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="red" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <MagicTree explosionFactor={explosionFactorRef} />

      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.1} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
        />
      </EffectComposer>

      <OrbitControls 
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={10}
        maxDistance={40}
      />
    </Canvas>
  );
};