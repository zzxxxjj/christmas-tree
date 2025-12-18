import React, { useEffect, useRef, useState } from 'react';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

interface HandControllerProps {
  setExplosionFactor: (val: number) => void;
  onStatusChange: (status: string) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ setExplosionFactor, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  
  // 🔒 性能锁：防止处理过快导致卡顿
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // 1. 初始化 Hands (使用在线 CDN)
    const hands = new Hands({
      locateFile: (file) => {
        // 🌐 方案一：使用 jsDelivr CDN 加载模型
        // 这样 Vercel 就不需要托管大文件了，加载速度会变快
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 2. 处理结果
    hands.onResults((results: Results) => {
      isProcessingRef.current = false; // 解锁
      setLoading(false);

      const canvasCtx = canvasRef.current?.getContext('2d');
      if (canvasCtx && canvasRef.current) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // 绘制黑色背景，保持 UI 统一
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: '#00FF00', lineWidth: 1, radius: 2 });

            const wrist = landmarks[0];
            const tips = [8, 12, 16, 20];
            let totalDist = 0;
            tips.forEach(idx => {
              const tip = landmarks[idx];
              const dx = tip.x - wrist.x;
              const dy = tip.y - wrist.y;
              totalDist += Math.sqrt(dx * dx + dy * dy);
            });
            
            const avgDist = totalDist / tips.length;
            const isFist = avgDist < 0.22;

            if (isFist) {
              setExplosionFactor(0);
              onStatusChange('TREE (FIST)');
            } else {
              setExplosionFactor(1);
              onStatusChange('EXPLODE (OPEN)');
            }
          }
        } else {
          onStatusChange('NO HAND DETECTED');
        }
        canvasCtx.restore();
      }
    });

    // 3. 启动摄像头
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (isProcessingRef.current || !videoRef.current) return;
          isProcessingRef.current = true;
          try {
            await hands.send({ image: videoRef.current });
          } catch (error) {
            console.error("Hands send error:", error);
            isProcessingRef.current = false;
          }
        },
        width: 640,
        height: 360,
      });

      camera.start().catch(err => {
        console.error("Camera start error:", err);
        onStatusChange("CAMERA ERROR");
      });
    }

    return () => {
      hands.close();
    };
  }, [setExplosionFactor, onStatusChange]);

  return (
    <div className="fixed bottom-4 right-4 z-50 border-2 border-green-500 rounded-lg overflow-hidden bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
      {/* 📱 iOS 兼容性关键点：
         使用 opacity-0 让视频不可见，但千万不能用 hidden 或 display:none。
         Safari 只有在视频元素“渲染中”时才允许获取视频流。
      */}
      <video 
        ref={videoRef} 
        className="absolute inset-0 opacity-0 pointer-events-none" 
        playsInline 
        muted 
      />
      
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={180} 
        className="w-[200px] h-[112px] mirror-video block bg-black"
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs font-mono animate-pulse bg-black pointer-events-none">
          LOADING AI...
        </div>
      )}
    </div>
  );
};