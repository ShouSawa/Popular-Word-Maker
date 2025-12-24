import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  rectIntersection,
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
import { Pen, RefreshCw, Download, FileText, FileImage, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SortableItem } from './components/SortableItem';
import FlameBackground from './components/FlameBackground';
import CurtainBackground from './components/CurtainBackground';
import HowToUse from './components/HowToUse';
import { LEDStrip } from './components/LEDStrip';
import { Snackbar } from './components/Snackbar';
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
  
  // Snackbar State
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setIsSnackbarVisible(true);
  };

  // Refs for export
  const rankingBoardRef = useRef<HTMLDivElement>(null);
  const boardTitleInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus board title input when editing starts
  useEffect(() => {
    if (isEditingBoardTitle && boardTitleInputRef.current) {
      boardTitleInputRef.current.focus();
    }
  }, [isEditingBoardTitle]);

  // Confirm before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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

            // Fix for title alignment
            const titleTexts = clonedDoc.querySelectorAll('.board-title-text');
            titleTexts.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-15px)';
            });

            // Hide edit icon
            const editIcons = clonedDoc.querySelectorAll('.edit-icon');
            editIcons.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
            });
        }
      }); 
      const link = document.createElement('a');
      link.download = 'ranking.png';
      link.href = canvas.toDataURL();
      link.click();
      showSnackbar('ランキングをPNGで保存しました');
    } catch (e) {
      console.error(e);
      showSnackbar('保存に失敗しました');
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

            // Fix for title alignment
            const titleTexts = clonedDoc.querySelectorAll('.board-title-text');
            titleTexts.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.transform = 'translateY(-15px)';
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
      showSnackbar('ランキングをPDFで保存しました');
    } catch (e) {
        console.error(e);
      showSnackbar('保存に失敗しました');
    }
  };

  const handleExportText = () => {
    const text = `${boardTitle}\n` + rankingItems.map((item, index) => `${index + 1}. ${item.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showSnackbar('ランキングをクリップボードに保存しました');
    });
  };

  const getRandomColor = () => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
      '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
      '#f43f5e', '#881337', '#7c2d12', '#78350f', '#365314',
      '#064e3b', '#164e63', '#1e3a8a', '#312e81', '#4c1d95'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleExportWordCloud = () => {
    if (rankingItems.length === 0) {
      showSnackbar('ランキングに単語がありません');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Word list with size
    const words = rankingItems.map((item, index) => {
      const rank = index + 1;
      let fontSize = 20;
      
      if (rank <= 5) {
        // 1st: 250, 2nd: 230, 3rd: 210, 4th: 190, 5th: 170
        fontSize = 250 - (rank - 1) * 20;
      } else {
        // Groups of 5
        const group = Math.floor((rank - 1) / 5); // 1 for 6-10
        // Base size for group 1 (6-10) should be smaller than rank 5 (170)
        if (group === 1) fontSize = 120;
        else if (group === 2) fontSize = 90;
        else if (group === 3) fontSize = 70;
        else if (group === 4) fontSize = 50;
        else fontSize = Math.max(30, 50 - (group - 4) * 5);
      }

      return {
        text: item.text,
        fontSize,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: getRandomColor(),
      };
    });

    // Placement
    const placedWords: typeof words = [];
    const center = { x: width / 2, y: height / 2 };
    
    // Helper to check collision
    const checkCollision = (word: typeof words[0], rects: typeof words) => {
      for (const rect of rects) {
        // Simple bounding box collision with padding
        const padding = 10;
        if (
          word.x < rect.x + rect.width + padding &&
          word.x + word.width + padding > rect.x &&
          word.y < rect.y + rect.height + padding &&
          word.y + word.height + padding > rect.y
        ) {
          return true;
        }
      }
      return false;
    };

    // Spiral
    for (const word of words) {
      // Initial measurement
      ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
      let metrics = ctx.measureText(word.text);
      word.width = metrics.width;
      word.height = word.fontSize * 0.85;

      // If word is wider than canvas, shrink it
      while (word.width > width * 0.9 && word.fontSize > 10) {
        word.fontSize *= 0.9;
        ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
        metrics = ctx.measureText(word.text);
        word.width = metrics.width;
        word.height = word.fontSize * 0.85;
      }

      let angle = Math.random() * Math.PI * 2;
      let radius = 0;
      const step = 0.2; // Angle step
      const spiralFactor = 10; // Radius growth per angle

      let placed = false;
      // Limit iterations
      for (let i = 0; i < 5000; i++) {
        word.x = center.x + radius * Math.cos(angle) - word.width / 2;
        word.y = center.y + radius * Math.sin(angle) - word.height / 2;

        if (!checkCollision(word, placedWords)) {
          // Check bounds
          if (word.x >= 0 && word.y >= 0 && word.x + word.width <= width && word.y + word.height <= height) {
              placedWords.push(word);
              placed = true;
              break;
          }
        }

        angle += step;
        radius = spiralFactor * angle;
      }
      
      // If not placed, try shrinking and retrying
      if (!placed && word.fontSize > 20) {
         // Try one more time with half size
         word.fontSize *= 0.5;
         ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
         metrics = ctx.measureText(word.text);
         word.width = metrics.width;
         word.height = word.fontSize * 0.85;
         
         angle = Math.random() * Math.PI * 2;
         radius = 0;
         
         for (let i = 0; i < 5000; i++) {
            word.x = center.x + radius * Math.cos(angle) - word.width / 2;
            word.y = center.y + radius * Math.sin(angle) - word.height / 2;

            if (!checkCollision(word, placedWords)) {
              if (word.x >= 0 && word.y >= 0 && word.x + word.width <= width && word.y + word.height <= height) {
                  placedWords.push(word);
                  placed = true;
                  break;
              }
            }
            angle += step;
            radius = spiralFactor * angle;
         }
      }

      if (!placed) {
          console.warn(`Could not place word: ${word.text}`);
      }
    }

    // Draw
    placedWords.forEach(word => {
      ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
      ctx.fillStyle = word.color;
      ctx.textBaseline = 'top';
      ctx.fillText(word.text, word.x, word.y);
    });

    // Download
    const link = document.createElement('a');
    link.download = 'wordcloud.png';
    link.href = canvas.toDataURL();
    link.click();
    showSnackbar('単語集画像を保存しました');
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
          collisionDetection={rectIntersection}
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
                className="flex-1 bg-yellow-50 rounded-lg shadow-xl border-4 border-yellow-600/50 overflow-hidden flex flex-col min-h-[400px]"
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
                      <textarea
                        ref={boardTitleInputRef}
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onBlur={() => setIsEditingBoardTitle(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            setIsEditingBoardTitle(false);
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
                        onClick={() => setIsEditingBoardTitle(true)}
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
                                {boardTitle}
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
                                {boardTitle}
                            </span>
                        </div>
                        <Pen size={20} className="text-white opacity-50 edit-icon" />
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

          <button
            onClick={handleExportWordCloud}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
          >
            <ImageIcon size={18} /> 単語集画像保存
          </button>
        </div>
      </div>
      <Snackbar 
        message={snackbarMessage} 
        isVisible={isSnackbarVisible} 
        onClose={() => setIsSnackbarVisible(false)} 
      />
    </div>
  );
}