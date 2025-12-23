import React from 'react';

const CurtainBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Main Background Color (Dark Red Stage) */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950 to-red-900 opacity-80"></div>

      {/* Left Curtain */}
      <div className="absolute top-0 left-0 w-1/6 h-full bg-gradient-to-r from-red-900 via-red-700 to-red-900 shadow-[10px_0_20px_rgba(0,0,0,0.5)] z-10">
         {/* Folds */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)]"></div>
      </div>
      
      {/* Right Curtain */}
      <div className="absolute top-0 right-0 w-1/6 h-full bg-gradient-to-l from-red-900 via-red-700 to-red-900 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-10">
         {/* Folds */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-90deg,transparent,transparent_40px,rgba(0,0,0,0.3)_50px,transparent_60px)]"></div>
      </div>

      {/* Top Valance (Header Curtain) */}
      <div className="absolute top-0 left-0 w-full h-32 z-20">
        <div className="w-full h-24 bg-gradient-to-b from-red-800 via-red-600 to-red-800 shadow-xl relative">
          {/* Gold Trim Top */}
          <div className="absolute top-4 w-full h-3 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 shadow-md"></div>
            
          {/* Folds */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(0,0,0,0.2)_100px,transparent_120px)]"></div>
        </div>
         {/* Scallops */}
        <div className="flex w-full relative -top-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 h-16 bg-gradient-to-b from-red-600 to-red-800 rounded-b-full border-b-4 border-yellow-500 shadow-lg relative"></div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CurtainBackground;
