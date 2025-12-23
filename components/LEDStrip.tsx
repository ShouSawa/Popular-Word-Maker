import React, { useMemo } from 'react';

interface LEDStripProps {
  count: number;
  direction: 'horizontal' | 'vertical';
  className?: string; // Container classes (padding, etc)
  dotSize?: string; // e.g. "w-3 h-3"
  shadowClass?: string; // e.g. "shadow-[...]"
  maxDelay?: number;
}

export const LEDStrip: React.FC<LEDStripProps> = React.memo(({ 
  count, 
  direction, 
  className = "", 
  dotSize = "w-2 h-2", 
  shadowClass = "shadow-[0_0_5px_2px_rgba(255,255,255,0.8)]",
  maxDelay = 1.0 
}) => {
  const delays = useMemo(() => {
    return Array.from({ length: count }, () => Math.random() * maxDelay);
  }, [count, maxDelay]);

  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row w-full justify-between' : 'flex-col h-full justify-between'} ${className}`}>
      {delays.map((delay, i) => (
        <div 
          key={i} 
          className={`rounded-full bg-white animate-pulse ${dotSize} ${shadowClass}`}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
});
