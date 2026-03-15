import React, { useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  rectIntersection,
} from '@dnd-kit/core';
import { RankingBoard } from './components/RankingBoard';
import FlameBackground from './components/FlameBackground';
import CurtainBackground from './components/CurtainBackground';
import HowToUse from './components/HowToUse';
import { Snackbar } from './components/Snackbar';
import Footer from './components/Footer';
import Title from './components/Title';
import InputArea from './components/InputArea';
import WaitingList from './components/WaitingList';
import GitHubLink from './components/GitHubLink';
import { useRankingManager } from './hooks/useRankingManager';
import { useExportActions } from './hooks/useExportActions';

const DEFAULT_TITLE = 'ランキングメーカーかああ';

export default function App() {
  const {
    boardTitle,
    setBoardTitle,
    isEditingBoardTitle,
    setIsEditingBoardTitle,
    inputText,
    setInputText,
    rankingItems,
    stackItems,
    emptySlots,
    activeDragItem,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    shuffleStack,
  } = useRankingManager();

  const [snackbarMessage, setSnackbarMessage] = useState('');         // スナックバーの文章
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);  // スナックバーの表示状態

  // スナックバーを表示する関数
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setIsSnackbarVisible(true);
  };

  const rankingBoardRef = useRef<HTMLDivElement>(null); // ランキングボードの参照
  const { handleExportPNG, handleExportPDF, handleExportText, handleExportWordCloud } = useExportActions({
    rankingBoardRef,
    rankingItems,
    boardTitle,
    showSnackbar,
  });
  
  const dropAnimation: DropAnimation = {
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: '0.4',
          },
        },
      }),
    };

  return (
    <div className="min-h-screen text-gray-800 pb-20 relative overflow-x-hidden">
      <CurtainBackground />
      <FlameBackground />

      <GitHubLink />

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <Title text={DEFAULT_TITLE} />

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-6">
            <HowToUse />
            <InputArea value={inputText} onChange={setInputText} />

            <div className="flex flex-col md:flex-row gap-6">
              <RankingBoard
                ref={rankingBoardRef}
                id="ranking"
                items={rankingItems}
                title={boardTitle}
                onTitleChange={setBoardTitle}
                isEditing={isEditingBoardTitle}
                onEditStart={() => setIsEditingBoardTitle(true)}
                onEditEnd={() => setIsEditingBoardTitle(false)}
                emptySlots={emptySlots}
              />

              <WaitingList items={stackItems} onShuffle={shuffleStack} />
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

        <Footer
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          onExportText={handleExportText}
          onExportWordCloud={handleExportWordCloud}
        />
      </div>
      <Snackbar 
        message={snackbarMessage} 
        isVisible={isSnackbarVisible} 
        onClose={() => setIsSnackbarVisible(false)} 
      />
    </div>
  );
}