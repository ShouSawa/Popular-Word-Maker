import { WordItem } from '../types/word';

export const generateId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const parseInputLines = (inputText: string) =>
    inputText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

    interface ListsState {
    rankingItems: WordItem[];
    stackItems: WordItem[];
    }

    export const syncListsWithLines = (
    currentLists: ListsState,
    lines: string[]
    ): ListsState => {
    const newWordCounts = new Map<string, number>();
    lines.forEach((line) => {
        newWordCounts.set(line, (newWordCounts.get(line) || 0) + 1);
    });

    const currentUsedCounts = new Map<string, number>();

    const nextRanking = currentLists.rankingItems.filter((item) => {
        const maxAllowed = newWordCounts.get(item.text) || 0;
        const used = currentUsedCounts.get(item.text) || 0;

        if (used < maxAllowed) {
        currentUsedCounts.set(item.text, used + 1);
        return true;
        }

        return false;
    });

    const nextStack = currentLists.stackItems.filter((item) => {
        const maxAllowed = newWordCounts.get(item.text) || 0;
        const used = currentUsedCounts.get(item.text) || 0;

        if (used < maxAllowed) {
        currentUsedCounts.set(item.text, used + 1);
        return true;
        }

        return false;
    });

    newWordCounts.forEach((count, word) => {
        const used = currentUsedCounts.get(word) || 0;

        if (count > used) {
        const needed = count - used;
        for (let i = 0; i < needed; i += 1) {
            nextStack.push({ id: generateId(), text: word });
        }
        }
    });

    return {
        rankingItems: nextRanking,
        stackItems: nextStack,
    };
    };

    export const calculateEmptySlots = (inputText: string, rankingLength: number) => {
    const wordCount = parseInputLines(inputText).length;
    const totalSlots = Math.max(5, wordCount);
    const emptySlotsCount = Math.max(0, totalSlots - rankingLength);

    return Array.from({ length: emptySlotsCount }, (_, i) => rankingLength + i + 1);
};
