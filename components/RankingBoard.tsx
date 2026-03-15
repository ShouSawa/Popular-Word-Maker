import React, { useRef, useEffect, forwardRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Pen } from 'lucide-react';
import { SortableItem } from './SortableItem';
import { LEDStrip } from './LEDStrip';
import { Droppable } from './Droppable';
import { WordItem } from '../types/word';

interface RankingBoardProps {
  id: string;
  items: WordItem[];
  title: string;
  onTitleChange: (title: string) => void;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  emptySlots: number[];
}

export const RankingBoard = forwardRef<HTMLDivElement, RankingBoardProps>((
  { id, items, title, onTitleChange, isEditing, onEditStart, onEditEnd, emptySlots },
  ref
) => {
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <Droppable 
      id={id} 
      className="flex-1 bg-yellow-50 rounded-lg shadow-xl border-4 border-yellow-600/50 overflow-hidden flex flex-col min-h-[400px]"
    >
      <div 
        ref={ref}
        className="flex-col flex h-full bg-yellow-50" 
      >
        <div className="bg-gray-900 p-4 text-center relative shadow-md group border-b-4 border-yellow-600 overflow-hidden">
          {/* LED Background Track */}
          <div className="absolute inset-0 border-[12px] border-yellow-900/80 pointer-events-none z-0"></div>

          {/* LED Border */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1 left-0 right-0 h-2"><LEDStrip count={50} direction="horizontal" className="px-2" dotSize="w-1 h-1" /></div>
            <div className="absolute bottom-1 left-0 right-0 h-2"><LEDStrip count={50} direction="horizontal" className="px-2" dotSize="w-1 h-1" /></div>
            <div className="absolute top-0 bottom-0 left-1 w-2"><LEDStrip count={8} direction="vertical" className="py-2" dotSize="w-1 h-1" /></div>
            <div className="absolute top-0 bottom-0 right-1 w-2"><LEDStrip count={8} direction="vertical" className="py-2" dotSize="w-1 h-1" /></div>
          </div>

          {isEditing ? (
            <textarea
              ref={titleInputRef}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onEditEnd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  onEditEnd();
                }
              }}
              className="w-full bg-transparent text-center font-black tracking-widest text-4xl outline-none border-b-2 border-white/50 relative z-20 bg-gradient-to-b from-amber-500 to-red-600 bg-clip-text text-transparent resize-none overflow-hidden"
              style={{
                  WebkitTextStroke: '2px white',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(3px 3px 0px #14532d)',
                  caretColor: 'white',
                  minHeight: '60px',
              }}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
            />
          ) : (
            <div 
              onClick={onEditStart}
              className="cursor-pointer hover:scale-105 transition-transform rounded px-2 flex items-center justify-center gap-2 py-2 relative z-20"
            >
              <div className="relative">
                  {/* Outer Green Stroke Layer */}
                  <span 
                      className="board-title-text absolute inset-0 flex items-center justify-center select-none font-black text-4xl md:text-5xl tracking-widest whitespace-pre-wrap"
                      style={{
                          WebkitTextStroke: '8px #14532d',
                          color: 'transparent',
                          zIndex: -1,
                      }}
                      aria-hidden="true"
                  >
                      {title}
                  </span>

                  {/* Main Text Layer */}
                  <span 
                      className="board-title-text relative font-black text-4xl md:text-5xl tracking-widest bg-gradient-to-b from-amber-500 to-red-600 bg-clip-text text-transparent block whitespace-pre-wrap"
                      style={{
                          WebkitTextStroke: '2px white',
                          paintOrder: 'stroke fill',
                          filter: 'drop-shadow(3px 3px 5px rgba(0,0,0,0.5))',
                      }}
                  >
                      {title}
                  </span>
              </div>
              <Pen size={20} className="text-white opacity-50 edit-icon" />
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4 relative">
          <SortableContext 
            id={id}
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col">
              {/* 1. Render Filled Ranking Slots */}
              {items.map((item, index) => {
                // Calculate background opacity for top 10 (Gold/Orange gradient)
                const opacity = index < 10 ? ((10 - index) / 10) * 0.6 : 0;
                const style = index < 10 ? { backgroundColor: `rgba(255, 165, 0, ${opacity})` } : {};

                return (
                  <div key={item.id} style={style} className="flex items-stretch mb-2 border-b-2 border-yellow-600/20 pb-1 rounded">
                    {/* Rank Number */}
                    <div className="ranking-number w-24 flex items-center justify-center font-['Abril_Fatface'] text-6xl text-amber-700 bg-transparent shrink-0 pb-4">
                      {index + 1}
                    </div>
                    {/* Draggable Item */}
                    <div className="flex-1 min-w-0">
                      <SortableItem id={item.id} text={item.text} />
                    </div>
                  </div>
                );
              })}

              {/* 2. Render Empty Slots (Placeholders) */}
              {emptySlots.map((rankNum) => (
                <div key={rankNum} className="flex items-center mb-2 h-[60px] border-b-2 border-dashed border-yellow-400/50">
                  {/* Rank Number */}
                  <div className="w-24 flex items-center justify-center font-['Abril_Fatface'] text-6xl text-amber-700/30 shrink-0 pb-4">
                    {rankNum}
                  </div>
                  {/* Empty Space Visual */}
                  <div className="flex-1 h-full flex items-center px-4 text-yellow-700/20 font-bold italic select-none">
                    Drop here...
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </Droppable>
  );
});
RankingBoard.displayName = 'RankingBoard';