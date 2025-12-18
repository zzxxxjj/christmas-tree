import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { HandController } from './components/HandController';

const App: React.FC = () => {
  const explosionFactorRef = useRef(1); 
  const [status, setStatus] = useState<string>('DETECTING...');

  // 🎵 音乐播放器设置
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; 
    }
  }, []);

  const handleSetExplosionFactor = useCallback((val: number) => {
    explosionFactorRef.current = val;
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  return (
    <div className="relative w-full h-full text-white font-mono overflow-hidden">
      <audio 
  ref={audioRef} 
  loop 
  src="https://cdn.jsdelivr.net/gh/zzxxxjj/christmas-tree@main/public/bgm.mp3" 
/>

      {/* 3D 场景层 */}
      <div className="absolute inset-0 z-0">
        <Scene explosionFactorRef={explosionFactorRef} />
      </div>

      {/* UI 区域 1：标题 (独立出来，放在正上方居中) */}
      <div className="absolute top-0 left-0 w-full pt-8 md:pt-12 z-10 pointer-events-none flex justify-center">
         <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] text-center">
          MERRY CHRISTMAS
        </h1>
      </div>

      {/* UI 区域 2：控制按钮 (保留在右上角，不挡视线) */}
      <div className="absolute top-0 right-0 z-10 p-4 pt-20 md:pt-4 flex flex-col items-end pointer-events-none origin-top-right scale-75 md:scale-100 transition-transform">
        
        {/* 音乐按钮 */}
        <button 
          onClick={toggleMusic}
          className="pointer-events-auto mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">
            {isPlaying ? '🔊' : '🔇'}
          </span>
          <span className="text-sm font-bold tracking-widest">
            {isPlaying ? 'MUSIC ON' : 'PLAY MUSIC'}
          </span>
        </button>
        
        {/* 手势说明 */}
        <div className="mt-4 flex flex-col md:flex-row gap-2 md:gap-8 text-xs md:text-base bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 items-end">
          <div className={`flex items-center gap-2 transition-colors duration-300 ${status.includes('OPEN') ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
            <span>OPEN: EXPLODE</span>
            <span className="text-xl">🖐</span>
          </div>
          <div className={`flex items-center gap-2 transition-colors duration-300 ${status.includes('FIST') ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
            <span>FIST: TREE</span>
            <span className="text-xl">✊</span>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-400 text-right">
           STATUS: <span className="text-white">{status}</span>
        </div>
      </div>

      <HandController 
        setExplosionFactor={handleSetExplosionFactor} 
        onStatusChange={setStatus} 
      />
    </div>
  );
};

export default App;