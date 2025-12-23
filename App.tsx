import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Pen, RefreshCw, Download, FileText, FileImage } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SortableItem } from './components/SortableItem';
import FlameBackground from './components/FlameBackground';
import CurtainBackground from './components/CurtainBackground';
import HowToUse from './components/HowToUse';
import { LEDStrip } from './components/LEDStrip';
import githubMark from './img/github-mark-white.png';

// Types
interface WordItem {
  id: string;
  text: string;
}

// Initial Data
const DEFAULT_TITLE = 'ランキングメーカー';

// Helper to generate unique IDs
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Droppable Component ---
// This allows the container itself (the empty background) to accept drops
const Droppable = ({ id, children, className, style }: { id: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className} style={style}>
      {children}
    </div>
  );
};

export default function App() {
  const [boardTitle, setBoardTitle] = useState('RANKING BOARD');
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Two lists: Ranking (Board) and Stack (Bench)
  const [rankingItems, setRankingItems] = useState<WordItem[]>([]);
  const [stackItems, setStackItems] = useState<WordItem[]>([]);
  
  const [activeDragItem, setActiveDragItem] = useState<WordItem | null>(null);
  
  // Refs for export
  const rankingBoardRef = useRef<HTMLDivElement>(null);
  const boardTitleInputRef = useRef<HTMLInputElement>(null);

  // Focus board title input when editing starts
  useEffect(() => {
    if (isEditingBoardTitle && boardTitleInputRef.current) {
      boardTitleInputRef.current.focus();
    }
  }, [isEditingBoardTitle]);

  // --- Logic: Sync Textarea with Blocks ---
  useEffect(() => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    syncItemsWithText(lines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText]);

  const syncItemsWithText = (lines: string[]) => {
    setRankingItems(currentRanking => {
      setStackItems(currentStack => {
        const newWordCounts = new Map<string, number>();
        lines.forEach(line => {
          newWordCounts.set(line, (newWordCounts.get(line) || 0) + 1);
        });

        const currentUsedCounts = new Map<string, number>();
        
        // Filter Ranking
        const nextRanking = currentRanking.filter(item => {
          const maxAllowed = newWordCounts.get(item.text) || 0;
          const used = currentUsedCounts.get(item.text) || 0;
          if (used < maxAllowed) {
            currentUsedCounts.set(item.text, used + 1);
            return true;
          }
          return false;
        });

        // Filter Stack
        const nextStack = currentStack.filter(item => {
          const maxAllowed = newWordCounts.get(item.text) || 0;
          const used = currentUsedCounts.get(item.text) || 0;
          if (used < maxAllowed) {
            currentUsedCounts.set(item.text, used + 1);
            return true;
          }
          return false;
        });

        // Add missing
        newWordCounts.forEach((count, word) => {
          const used = currentUsedCounts.get(word) || 0;
          if (count > used) {
            const needed = count - used;
            for (let i = 0; i < needed; i++) {
              nextStack.push({ id: generateId(), text: word });
            }
          }
        });
        
        return nextStack;
      });
      
      // Re-calculate ranking
      const newWordCounts = new Map<string, number>();
        lines.forEach(line => {
          newWordCounts.set(line, (newWordCounts.get(line) || 0) + 1);
        });
        const currentUsedCounts = new Map<string, number>();
        const nextRanking = currentRanking.filter(item => {
          const maxAllowed = newWordCounts.get(item.text) || 0;
          const used = currentUsedCounts.get(item.text) || 0;
          if (used < maxAllowed) {
            currentUsedCounts.set(item.text, used + 1);
            return true;
          }
          return false;
        });
        return nextRanking;
    });
  };

  // --- Drag & Drop Config ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string) => {
    if (rankingItems.find((i) => i.id === id)) return 'ranking';
    if (stackItems.find((i) => i.id === id)) return 'stack';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    const item = rankingItems.find(i => i.id === id) || stackItems.find(i => i.id === id);
    setActiveDragItem(item || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find containers
    const activeContainer = findContainer(activeId);
    // If over a container directly (empty space), use its id, else find item's container
    const overContainer = (overId === 'ranking' || overId === 'stack') 
      ? overId 
      : findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving between lists
    if (activeContainer === 'ranking') {
      setRankingItems((items) => {
        const activeIndex = items.findIndex((i) => i.id === activeId);
        return items.filter((_, index) => index !== activeIndex);
      });
      setStackItems((items) => {
        const activeItem = rankingItems.find(i => i.id === activeId);
        if (!activeItem) return items; // Safety check
        
        const overIndex = items.findIndex((i) => i.id === overId);
        let newIndex;
        if (overId === 'stack') {
          newIndex = items.length + 1;
        } else {
          const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overIndex >= 0 ? overIndex + modifier : items.length + 1;
        }

        return [
          ...items.slice(0, newIndex),
          activeItem,
          ...items.slice(newIndex, items.length),
        ];
      });
    } else {
      setStackItems((items) => {
        const activeIndex = items.findIndex((i) => i.id === activeId);
        return items.filter((_, index) => index !== activeIndex);
      });
      setRankingItems((items) => {
        const activeItem = stackItems.find(i => i.id === activeId);
        if (!activeItem) return items;

        const overIndex = items.findIndex((i) => i.id === overId);
        let newIndex;
        if (overId === 'ranking') {
            newIndex = items.length + 1;
        } else {
            const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : items.length + 1;
        }
        
        return [
          ...items.slice(0, newIndex),
          activeItem,
          ...items.slice(newIndex, items.length),
        ];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeContainer = findContainer(activeId);
    const overContainer = (overId === 'ranking' || overId === 'stack') ? overId : findContainer(overId);

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = (activeContainer === 'ranking' ? rankingItems : stackItems).findIndex(i => i.id === activeId);
      const overIndex = (overContainer === 'ranking' ? rankingItems : stackItems).findIndex(i => i.id === overId);

      if (activeIndex !== overIndex) {
        if (activeContainer === 'ranking') {
          setRankingItems((items) => arrayMove(items, activeIndex, overIndex));
        } else {
          setStackItems((items) => arrayMove(items, activeIndex, overIndex));
        }
      }
    }
  };

  // --- Features ---

  const shuffleStack = () => {
    setStackItems(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const handleExportPNG = async () => {
    if (!rankingBoardRef.current) return;
    try {
      // Temporarily remove max-height restrictions if any for full capture
      const canvas = await html2canvas(rankingBoardRef.current, { 
        backgroundColor: '#FFF5E1',
        scale: 2, // Improve quality
        onclone: (clonedDoc) => {
            // Fix for background-clip: text rendering as a solid block in html2canvas
            const elements = clonedDoc.querySelectorAll('[class*="bg-clip-text"]');
            elements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.background = 'none';
                htmlEl.style.webkitTextFillColor = 'initial';
                htmlEl.style.color = '#b45309'; // Fallback color (amber-700)
            });

            // Fix for vertical alignment in export (Ranking Numbers)
            const rankingNumbers = clonedDoc.querySelectorAll('.ranking-number');
            rankingNumbers.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-15px)'; // Shift up significantly for export
                htmlEl.style.paddingBottom = '0'; 
            });

            // Fix for vertical alignment in export (Word Items)
            const wordItems = clonedDoc.querySelectorAll('.sortable-item-text');
            wordItems.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-5px)'; // Shift up slightly
                htmlEl.style.overflow = 'visible';
            });
        }
      }); 
      const link = document.createElement('a');
      link.download = 'ranking.png';
      link.href = canvas.toDataURL();
      link.click();
      alert('ランキングをPNGで保存しました');
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  };

  const handleExportPDF = async () => {
    if (!rankingBoardRef.current) return;
    try {
      const canvas = await html2canvas(rankingBoardRef.current, { 
        backgroundColor: '#FFF5E1',
        scale: 2,
        onclone: (clonedDoc) => {
            // Fix for background-clip: text rendering as a solid block in html2canvas
            const elements = clonedDoc.querySelectorAll('[class*="bg-clip-text"]');
            elements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.background = 'none';
                htmlEl.style.webkitTextFillColor = 'initial';
                htmlEl.style.color = '#b45309'; // Fallback color (amber-700)
            });

            // Fix for vertical alignment in export (Ranking Numbers)
            const rankingNumbers = clonedDoc.querySelectorAll('.ranking-number');
            rankingNumbers.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-15px)'; // Shift up significantly for export
                htmlEl.style.paddingBottom = '0';
            });

            // Fix for vertical alignment in export (Word Items)
            const wordItems = clonedDoc.querySelectorAll('.sortable-item-text');
            wordItems.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-5px)'; // Shift up slightly
                htmlEl.style.overflow = 'visible';
            });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('ranking.pdf');
      alert('ランキングをPDFで保存しました');
    } catch (e) {
        console.error(e);
      alert('保存に失敗しました');
    }
  };

  const handleExportText = () => {
    const text = `${boardTitle}\n` + rankingItems.map((item, index) => `${index + 1}. ${item.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('ランキングをクリップボードに保存しました');
    });
  };
  
  const dropAnimation: DropAnimation = {
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: '0.4',
          },
        },
      }),
    };

  // Calculate Slots
  const wordCount = inputText.split('\n').filter(l => l.trim() !== '').length;
  // Ensure we have at least 5 slots, or more if words are added
  const totalSlots = Math.max(5, wordCount);
  
  // Create empty slots array for rendering placeholders
  const emptySlotsCount = Math.max(0, totalSlots - rankingItems.length);
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, i) => rankingItems.length + i + 1);

  return (
    <div className="min-h-screen text-gray-800 pb-20 relative overflow-x-hidden">
      <CurtainBackground />
      <FlameBackground />

      {/* GitHub Link */}
      <a 
        href="https://github.com/ShouSawa/Popular-Word-Maker"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-50 bg-black rounded-full p-1 hover:scale-110 transition-all shadow-lg border border-white/30 flex items-center justify-center"
        title="View on GitHub"
      >
        <img src={githubMark} alt="GitHub" className="w-8 h-8" />
      </a>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        
        {/* Title Section */}
        <div className="flex justify-center mb-12 mt-4 relative z-20">
          <div className="relative px-12 py-6">
            {/* Plaque Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-800 to-red-950 rounded-3xl border-[6px] border-double border-yellow-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
               {/* Inner decorative line */}
              <div className="absolute inset-2 border border-yellow-500/30 rounded-2xl"></div>
            </div>

            {/* Title Text */}
            <h1 className="relative text-5xl md:text-7xl font-black text-center tracking-wider z-10">
              {/* Stroke Layer */}
              <span 
                className="absolute inset-0 flex items-center justify-center select-none"
                style={{
                  WebkitTextStroke: '10px #B45309', // amber-700
                  color: 'transparent',
                }}
                aria-hidden="true"
              >
                {DEFAULT_TITLE}
              </span>
              
              {/* Gradient Fill Layer */}
              <span 
                className="relative bg-gradient-to-b from-white via-gray-100 to-gray-300 bg-clip-text text-transparent"
                style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}
              >
                {DEFAULT_TITLE}
              </span>
            </h1>

            {/* Sparkles */}
            <div className="absolute -top-4 -right-4 text-yellow-200 animate-bounce text-4xl z-20">✨</div>
            <div className="absolute -bottom-2 -left-4 text-yellow-200 animate-pulse text-3xl z-20" style={{animationDelay: '0.7s'}}>✨</div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-6">
            
            {/* How To Use Section */}
            <HowToUse />

            {/* Input Area */}
            <div className="w-full bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border-2 border-red-900/30">
              <label className="block text-red-900 font-bold mb-2">エントリー単語 (1行1単語)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none font-medium"
                placeholder="ここに単語を入力してください..."
              />
            </div>

            {/* Main Content: Ranking & Stack */}
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Ranking Board */}
              <Droppable 
                id="ranking" 
                className="flex-1 bg-yellow-50 rounded-lg shadow-xl border-4 border-yellow-600/50 overflow-hidden flex flex-col"
              >
                <div 
                  ref={rankingBoardRef}
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

                    {isEditingBoardTitle ? (
                      <input
                        ref={boardTitleInputRef}
                        type="text"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onBlur={() => setIsEditingBoardTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingBoardTitle(false)}
                        className="w-full bg-transparent text-center font-black tracking-widest text-4xl outline-none border-b-2 border-white/50 relative z-20 bg-gradient-to-b from-amber-500 to-red-600 bg-clip-text text-transparent"
                        style={{
                            WebkitTextStroke: '2px white',
                            paintOrder: 'stroke fill',
                            filter: 'drop-shadow(3px 3px 0px #14532d)',
                        }}
                      />
                    ) : (
                      <div 
                        onClick={() => setIsEditingBoardTitle(true)}
                        className="cursor-pointer hover:scale-105 transition-transform rounded px-2 flex items-center justify-center gap-2 py-2 relative z-20"
                      >
                        <div className="relative">
                            {/* Outer Green Stroke Layer */}
                            <span 
                                className="absolute inset-0 flex items-center justify-center select-none font-black text-4xl md:text-5xl tracking-widest"
                                style={{
                                    WebkitTextStroke: '8px #14532d',
                                    color: 'transparent',
                                    zIndex: -1,
                                }}
                                aria-hidden="true"
                            >
                                {boardTitle}
                            </span>

                            {/* Main Text Layer */}
                            <span 
                                className="relative font-black text-4xl md:text-5xl tracking-widest bg-gradient-to-b from-amber-500 to-red-600 bg-clip-text text-transparent block"
                                style={{
                                    WebkitTextStroke: '2px white',
                                    paintOrder: 'stroke fill',
                                    filter: 'drop-shadow(3px 3px 5px rgba(0,0,0,0.5))',
                                }}
                            >
                                {boardTitle}
                            </span>
                        </div>
                        <Pen size={20} className="text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 relative">
                    <SortableContext 
                      id="ranking"
                      items={rankingItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col">
                        {/* 1. Render Filled Ranking Slots */}
                        {rankingItems.map((item, index) => {
                          // Calculate background opacity for top 10 (Gold/Orange gradient)
                          const opacity = index < 10 ? ((10 - index) / 10) * 0.6 : 0;
                          const style = index < 10 ? { backgroundColor: `rgba(255, 215, 0, ${opacity})` } : {};

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
                          <div key={`empty-${rankNum}`} className="flex items-center mb-2 h-[60px] border-b-2 border-dashed border-yellow-400/50">
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

              {/* Word Stack */}
              <div className="w-full md:w-80 flex flex-col gap-2">
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-t-lg backdrop-blur-md">
                  <span className="text-white font-bold px-2">Waiting List</span>
                  <button 
                    onClick={shuffleStack}
                    className="text-white bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full shadow-lg transition-transform hover:rotate-180 active:scale-95"
                    title="シャッフル"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
                
                <Droppable 
                  id="stack"
                  className="bg-gray-100/90 rounded-b-lg shadow-xl p-4 border-2 border-gray-400/50 flex-1 min-h-[300px]"
                >
                  <SortableContext 
                    id="stack"
                    items={stackItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 min-h-full">
                      {stackItems.map((item) => (
                        <SortableItem key={item.id} id={item.id} text={item.text} />
                      ))}
                      {stackItems.length === 0 && (
                        <div className="h-20 flex items-center justify-center text-gray-400 italic font-bold">
                          待機中の単語はありません
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </Droppable>
              </div>

            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeDragItem ? (
              <div className="bg-white rounded-md shadow-2xl border-2 border-purple-500 p-3 w-full max-w-[300px] cursor-grabbing transform scale-105">
                <span className="text-purple-700 font-bold text-lg block truncate">
                  {activeDragItem.text}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Footer Buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-4 flex justify-center items-center gap-4 z-50 border-t border-red-900">
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
          >
            <FileImage size={18} /> PNG保存
          </button>
          
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
          >
            <FileText size={18} /> PDF保存
          </button>

          <button
            onClick={handleExportText}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
          >
            <Download size={18} /> テキスト保存
          </button>
        </div>
      </div>
    </div>
  );
}