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
  
  // 🔒 性能锁：防止上一帧没处理完就塞下一帧，导致手机卡死
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // 1. 初始化 Hands 实例
    const hands = new Hands({
      locateFile: (file) => {
        // ⭐ 核心修改：强制指向本地 public/models 目录
        // 确保你的 public/models 文件夹里有 hands_solution_packed_assets_loader.js 等文件
        return `/models/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 2. 处理识别结果
    hands.onResults((results: Results) => {
      // 解锁，允许处理下一帧
      isProcessingRef.current = false;
      setLoading(false);

      const canvasCtx = canvasRef.current?.getContext('2d');
      if (canvasCtx && canvasRef.current) {
        canvasCtx.save();
        
        // 绘制背景
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          for (const landmarks of results.multiHandLandmarks) {
            // 绘制骨架 (绿色风格)
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: '#00FF00', lineWidth: 1, radius: 2 });

            // --- 简单的握拳/张手判断逻辑 ---
            const wrist = landmarks[0];
            const tips = [8, 12, 16, 20]; // 食指、中指、无名指、小指尖
            
            let totalDist = 0;
            tips.forEach(idx => {
              const tip = landmarks[idx];
              const dx = tip.x - wrist.x;
              const dy = tip.y - wrist.y;
              totalDist += Math.sqrt(dx * dx + dy * dy);
            });
            
            const avgDist = totalDist / tips.length;

            // 阈值判断 (根据实际体验微调)
            const isFist = avgDist < 0.22;

            if (isFist) {
              setExplosionFactor(0); // 握拳 -> 树
              onStatusChange('TREE (FIST)');
            } else {
              setExplosionFactor(1); // 张手 -> 爆炸
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
          // 🔒 性能锁检查
          if (isProcessingRef.current || !videoRef.current) return;
          
          isProcessingRef.current = true;
          try {
            await hands.send({ image: videoRef.current });
          } catch (error) {
            console.error("Hands send error:", error);
            isProcessingRef.current = false; // 出错也要解锁
          }
        },
        width: 640, // 降低分辨率以提高性能
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
      {/* ⚠️ iOS 核心修复：
        1. 不能用 hidden 或 display:none，否则 Safari 会暂停视频流。
        2. 改用 opacity-0 + absolute，让它在渲染树上但不可见。
        3. 必须加 playsInline (React写法是驼峰)
      */}
      <video 
        ref={videoRef} 
        className="absolute inset-0 opacity-0 pointer-events-none" 
        playsInline 
        muted 
      />
      
      {/* 只有 Canvas 是可见的 */}
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