import React, { useEffect, useRef, useState } from 'react';
import * as mpHands from '@mediapipe/hands';
import * as drawingUtils from '@mediapipe/drawing_utils';

interface HandControllerProps {
  setExplosionFactor: (val: number) => void;
  onStatusChange: (status: string) => void;
}

// Safely retrieve Hands class from default or named export
const Hands = (mpHands as any).Hands || (mpHands as any).default?.Hands;

// Safely retrieve drawing functions
const drawConnectors = (drawingUtils as any).drawConnectors || (drawingUtils as any).default?.drawConnectors;
const drawLandmarks = (drawingUtils as any).drawLandmarks || (drawingUtils as any).default?.drawLandmarks;

// Define Results interface locally since named imports might fail
interface Results {
    multiHandLandmarks: Array<Array<{x: number, y: number, z: number}>>;
    image: any;
    multiHandedness: any[];
}

// Define HAND_CONNECTIONS locally to avoid import issues with the CDN module
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

export const HandController: React.FC<HandControllerProps> = ({ setExplosionFactor, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (!Hands) {
        onStatusChange("LIB ERROR: Hands not found");
        return;
    }

    let active = true;

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      if (!active) return;
      setLoading(false);
      
      const canvasCtx = canvasRef.current?.getContext('2d');
      if (canvasCtx && canvasRef.current) {
        canvasCtx.save();
        
        // Fill background with black to hide video feed/other objects
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          for (const landmarks of results.multiHandLandmarks) {
            if (drawConnectors) {
                // Green stripes for connections
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            }
            if (drawLandmarks) {
                // Green dots for landmarks to match the aesthetic
                drawLandmarks(canvasCtx, landmarks, { color: '#00FF00', lineWidth: 1, radius: 2 });
            }

            // LOGIC: Detect Fist vs Open Hand
            // Method: Average distance from fingertips to wrist (Landmark 0)
            const wrist = landmarks[0];
            const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
            
            let totalDist = 0;
            tips.forEach(idx => {
              const tip = landmarks[idx];
              const dx = tip.x - wrist.x;
              const dy = tip.y - wrist.y;
              totalDist += Math.sqrt(dx * dx + dy * dy);
            });
            
            const avgDist = totalDist / tips.length;

            // Threshold: Open hand > ~0.3-0.4, Fist < ~0.2
            // Used 0.22 as a sweet spot for "Fist" detection
            const isFist = avgDist < 0.22;

            if (isFist) {
              setExplosionFactor(0); // Tree
              onStatusChange('TREE (FIST)');
            } else {
              setExplosionFactor(1); // Explode
              onStatusChange('EXPLODE (OPEN)');
            }
          }
        } else {
          // No hands detected
          onStatusChange('NO HAND DETECTED');
        }
        canvasCtx.restore();
      }
    });

    // Manual Camera Loop
    const detect = async () => {
      if (!active) return;
      
      if (videoRef.current && videoRef.current.readyState >= 2) {
         try {
           await hands.send({ image: videoRef.current });
         } catch (err) {
           console.error("MediaPipe send error:", err);
         }
      }
      // Schedule next frame
      requestRef.current = requestAnimationFrame(detect);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 360 },
                facingMode: 'user' 
            }
        });

        if (active && videoRef.current) {
            videoRef.current.srcObject = stream;
            // Wait for video to load enough data to play
            videoRef.current.onloadeddata = () => {
                if (active && videoRef.current) {
                    videoRef.current.play().catch(e => console.error("Play error", e));
                    detect();
                }
            };
        }
      } catch (e) {
        console.error("Camera setup error:", e);
        if (active) {
            onStatusChange("CAMERA ERROR - Allow Perms");
            setLoading(false);
        }
      }
    };

    startCamera();

    return () => {
        active = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        hands.close();
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [setExplosionFactor, onStatusChange]);

  return (
    <div className="fixed bottom-4 right-4 z-50 border-2 border-green-500 rounded-lg overflow-hidden bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
      {/* Hidden Video Source */}
      <video ref={videoRef} className="hidden" playsInline muted />
      
      {/* Visible Feedback Canvas */}
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={180} 
        className="w-[200px] h-[112px] mirror-video block bg-black"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs font-mono animate-pulse bg-black">
          INIT CAMERA...
        </div>
      )}
    </div>
  );
};