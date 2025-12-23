import React from 'react';
import { LEDStrip } from './LEDStrip';

const HowToUse: React.FC = React.memo(() => {
  const dotSize = "w-3 h-3";
  const shadowClass = "shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]";
  const maxDelay = 1.5;

  return (
    <div className="relative bg-yellow-500 border-8 border-yellow-800 rounded-2xl p-2 shadow-2xl overflow-hidden mb-8">
      {/* LED Frame Container */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top */}
        <div className="absolute top-2 left-0 right-0 h-4">
          <LEDStrip count={40} direction="horizontal" className="px-4" dotSize={dotSize} shadowClass={shadowClass} maxDelay={maxDelay} />
        </div>
        {/* Bottom */}
        <div className="absolute bottom-2 left-0 right-0 h-4">
          <LEDStrip count={40} direction="horizontal" className="px-4" dotSize={dotSize} shadowClass={shadowClass} maxDelay={maxDelay} />
        </div>
        {/* Left */}
        <div className="absolute top-0 bottom-0 left-2 w-4">
          <LEDStrip count={8} direction="vertical" className="py-4" dotSize={dotSize} shadowClass={shadowClass} maxDelay={maxDelay} />
        </div>
        {/* Right */}
        <div className="absolute top-0 bottom-0 right-2 w-4">
          <LEDStrip count={8} direction="vertical" className="py-4" dotSize={dotSize} shadowClass={shadowClass} maxDelay={maxDelay} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-yellow-400 rounded-xl p-6 m-4 border-4 border-yellow-700/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] relative z-0">
        <div className="text-yellow-900 font-bold text-center">
          <h2 className="text-3xl mb-4 inline-block border-b-4 border-yellow-800 pb-1 px-8 tracking-widest drop-shadow-sm">
            HOW TO PLAY
          </h2>
          <div className="bg-yellow-100/90 p-6 rounded-xl text-left shadow-lg border-2 border-yellow-600/20">
            <ul className="list-none space-y-3 text-lg font-bold text-yellow-900">
              <li className="flex items-center gap-3">
                <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</span>
                <span>下のテキストボックスに単語を入力（改行で区切ってね）</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</span>
                <span>自動で作られた単語カードをドラッグ＆ドロップ！</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">3</span>
                <span>ランキングボードに並べて順位を決めよう！（タイトルをクリックすると変更できるよ）</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">4</span>
                <span>完成したら画像保存してシェアしてね✨</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HowToUse;
