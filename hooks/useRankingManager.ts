import { useEffect, useMemo, useState } from 'react';
import {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { WordItem } from '../types/word';
import { calculateEmptySlots, parseInputLines, syncListsWithLines } from '../utils/ranking';

interface ListsState {
    rankingItems: WordItem[];
    stackItems: WordItem[];
}

const insertAt = (items: WordItem[], index: number, item: WordItem) => {
    const safeIndex = Math.max(0, Math.min(index, items.length));
    return [...items.slice(0, safeIndex), item, ...items.slice(safeIndex)];
};

export const useRankingManager = () => {
    const [boardTitle, setBoardTitle] = useState('RANKING BOARD');
    const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
    const [inputText, setInputText] = useState('');
    const [lists, setLists] = useState<ListsState>({ rankingItems: [], stackItems: [] });
    const [activeDragItem, setActiveDragItem] = useState<WordItem | null>(null);

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

    useEffect(() => {
        const lines = parseInputLines(inputText);
        setLists((currentLists) => syncListsWithLines(currentLists, lines));
    }, [inputText]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (id: string, targetLists: ListsState) => {
        if (targetLists.rankingItems.some((item) => item.id === id)) {
        return 'ranking' as const;
        }
        if (targetLists.stackItems.some((item) => item.id === id)) {
        return 'stack' as const;
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        const item =
        lists.rankingItems.find((rankingItem) => rankingItem.id === id) ||
        lists.stackItems.find((stackItem) => stackItem.id === id);

        setActiveDragItem(item || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) {
        return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        setLists((currentLists) => {
        const activeContainer = findContainer(activeId, currentLists);
        const overContainer =
            overId === 'ranking' || overId === 'stack' ? overId : findContainer(overId, currentLists);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return currentLists;
        }

        const sourceItems =
            activeContainer === 'ranking' ? currentLists.rankingItems : currentLists.stackItems;
        const targetItems = overContainer === 'ranking' ? currentLists.rankingItems : currentLists.stackItems;

        const activeIndex = sourceItems.findIndex((item) => item.id === activeId);
        const activeItem = sourceItems[activeIndex];
        if (!activeItem) {
            return currentLists;
        }

        const nextSource = sourceItems.filter((_, index) => index !== activeIndex);

        const overIndex = targetItems.findIndex((item) => item.id === overId);
        let newIndex = targetItems.length;

        if (overId !== overContainer) {
            const isBelowOverItem =
            active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : targetItems.length;
        }

        const nextTarget = insertAt(targetItems, newIndex, activeItem);

        if (activeContainer === 'ranking') {
            return {
            rankingItems: nextSource,
            stackItems: nextTarget,
            };
        }

        return {
            rankingItems: nextTarget,
            stackItems: nextSource,
        };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) {
        return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        setLists((currentLists) => {
        const activeContainer = findContainer(activeId, currentLists);
        const overContainer =
            overId === 'ranking' || overId === 'stack' ? overId : findContainer(overId, currentLists);

        if (!activeContainer || !overContainer || activeContainer !== overContainer) {
            return currentLists;
        }

        const targetItems =
            activeContainer === 'ranking' ? currentLists.rankingItems : currentLists.stackItems;

        const activeIndex = targetItems.findIndex((item) => item.id === activeId);
        const overIndex = targetItems.findIndex((item) => item.id === overId);

        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
            return currentLists;
        }

        const reordered = arrayMove(targetItems, activeIndex, overIndex);

        if (activeContainer === 'ranking') {
            return {
            ...currentLists,
            rankingItems: reordered,
            };
        }

        return {
            ...currentLists,
            stackItems: reordered,
        };
        });
    };

    const shuffleStack = () => {
        setLists((currentLists) => {
        const shuffled = [...currentLists.stackItems];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return {
            ...currentLists,
            stackItems: shuffled,
        };
        });
    };

    const emptySlots = useMemo(
        () => calculateEmptySlots(inputText, lists.rankingItems.length),
        [inputText, lists.rankingItems.length]
    );

    return {
        boardTitle,
        setBoardTitle,
        isEditingBoardTitle,
        setIsEditingBoardTitle,
        inputText,
        setInputText,
        rankingItems: lists.rankingItems,
        stackItems: lists.stackItems,
        emptySlots,
        activeDragItem,
        sensors,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        shuffleStack,
    };
};
