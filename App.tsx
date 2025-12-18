import React, { useRef, useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { HandController } from './components/HandController';

const App: React.FC = () => {
  // Use a Ref for the animation loop to read from without triggering React renders
  // 0 = Tree, 1 = Exploded
  const explosionFactorRef = useRef(1); 
  
  // State for UI Feedback only
  const [status, setStatus] = useState<string>('DETECTING...');

  const handleSetExplosionFactor = useCallback((val: number) => {
    explosionFactorRef.current = val;
  }, []);

  return (
    <div className="relative w-full h-full text-white font-mono">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene explosionFactorRef={explosionFactorRef} />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 z-10 pointer-events-none flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          MERRY CHRISTMAS
        </h1>
        
        <div className="mt-8 flex gap-8 text-sm md:text-base bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/10">
          <div className={`flex items-center gap-2 transition-colors duration-300 ${status.includes('OPEN') ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
            <span className="text-2xl">🖐</span>
            <span>OPEN: EXPLODE</span>
          </div>
          <div className={`flex items-center gap-2 transition-colors duration-300 ${status.includes('FIST') ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
            <span className="text-2xl">✊</span>
            <span>FIST: TREE</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
           STATUS: <span className="text-white">{status}</span>
        </div>
      </div>

      {/* Hand Controller (Hidden logic + Mini View) */}
      <HandController 
        setExplosionFactor={handleSetExplosionFactor} 
        onStatusChange={setStatus} 
      />
    </div>
  );
};

export default App;
