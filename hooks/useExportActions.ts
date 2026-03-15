import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { WordItem } from '../types/word';
import React from 'react';

interface ExportActionsArgs {
    rankingBoardRef: React.RefObject<HTMLDivElement | null>;
    rankingItems: WordItem[];
    boardTitle: string;
    showSnackbar: (message: string) => void;
}

interface CloneFixOptions {
    hideEditIcon: boolean;
}

// 各文字のスタイルをエクスポート用に修正する関数
const applyExportCloneFixes = (clonedDoc: Document, options: CloneFixOptions) => {
    const elements = clonedDoc.querySelectorAll('[class*="bg-clip-text"]');
    elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.background = 'none';
        htmlEl.style.webkitTextFillColor = 'initial';
        htmlEl.style.color = '#b45309';
    });

    const rankingNumbers = clonedDoc.querySelectorAll('.ranking-number');
    rankingNumbers.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = 'translateY(-15px)';
        htmlEl.style.paddingBottom = '0';
    });

    const wordItems = clonedDoc.querySelectorAll('.sortable-item-text');
    wordItems.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = 'translateY(-5px)';
        htmlEl.style.overflow = 'visible';
    });

    const titleTexts = clonedDoc.querySelectorAll('.board-title-text');
    titleTexts.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = 'translateY(-15px)';
    });

    if (options.hideEditIcon) {
        const editIcons = clonedDoc.querySelectorAll('.edit-icon');
            editIcons.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
        });
    }
};

// ランダムな色を生成する関数
const getRandomColor = () => {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
        '#f43f5e', '#881337', '#7c2d12', '#78350f', '#365314',
        '#064e3b', '#164e63', '#1e3a8a', '#312e81', '#4c1d95',
    ];

    return colors[Math.floor(Math.random() * colors.length)];
};

// ランキングをPNGやPDFとしてエクスポートするための関数
export const useExportActions = ({
        rankingBoardRef,
        rankingItems,
        boardTitle,
        showSnackbar,
    }: ExportActionsArgs) => {

    const handleExportPNG = useCallback(async () => {
        if (!rankingBoardRef.current) {
        return;
    }

    try {
        const canvas = await html2canvas(rankingBoardRef.current, {
            backgroundColor: '#FFF5E1',
            scale: 2,
            onclone: (clonedDoc) => applyExportCloneFixes(clonedDoc, { hideEditIcon: true }),
        });

        const link = document.createElement('a');
        link.download = 'ranking.png';
        link.href = canvas.toDataURL();
        link.click();
        showSnackbar('ランキングをPNGで保存しました');
    } catch (error) {
        console.error(error);
        showSnackbar('保存に失敗しました');
    }
    }, [rankingBoardRef, showSnackbar]);

    const handleExportPDF = useCallback(async () => {
        if (!rankingBoardRef.current) {
            return;
        }

        try {
            const canvas = await html2canvas(rankingBoardRef.current, {
                backgroundColor: '#FFF5E1',
                scale: 2,
                onclone: (clonedDoc) => applyExportCloneFixes(clonedDoc, { hideEditIcon: false }),
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('ranking.pdf');
            showSnackbar('ランキングをPDFで保存しました');
        } catch (error) {
            console.error(error);
            showSnackbar('保存に失敗しました');
        }
    }, [rankingBoardRef, showSnackbar]);

    const handleExportText = useCallback(() => {
        const text = `${boardTitle}\n${rankingItems
        .map((item, index) => `${index + 1}. ${item.text}`)
        .join('\n')}`;

        navigator.clipboard
        .writeText(text)
        .then(() => {
            showSnackbar('ランキングをクリップボードに保存しました');
        })
        .catch((error) => {
            console.error(error);
            showSnackbar('保存に失敗しました');
        });
    }, [boardTitle, rankingItems, showSnackbar]);

    const handleExportWordCloud = useCallback(() => {
        if (rankingItems.length === 0) {
            showSnackbar('ランキングに単語がありません');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            showSnackbar('保存に失敗しました');
            return;
        }

        const width = 1920;
        const height = 1080;
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const words = rankingItems.map((item, index) => {
            const rank = index + 1;
            let fontSize = 20;

            if (rank <= 5) {
                fontSize = 250 - (rank - 1) * 20;
            } else {
                const group = Math.floor((rank - 1) / 5);
                if (group === 1) {
                    fontSize = 120;
                } else if (group === 2) {
                    fontSize = 90;
                } else if (group === 3) {
                    fontSize = 70;
                } else if (group === 4) {
                    fontSize = 50;
                } else {
                    fontSize = Math.max(30, 50 - (group - 4) * 5);
                }
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

        const placedWords: typeof words = [];
        const center = { x: width / 2, y: height / 2 };

        const checkCollision = (word: (typeof words)[0], rects: typeof words) => {
            for (const rect of rects) {
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

        for (const word of words) {
            ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
            let metrics = ctx.measureText(word.text);
            word.width = metrics.width;
            word.height = word.fontSize * 0.85;

            while (word.width > width * 0.9 && word.fontSize > 10) {
                word.fontSize *= 0.9;
                ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
                metrics = ctx.measureText(word.text);
                word.width = metrics.width;
                word.height = word.fontSize * 0.85;
            }

            let angle = Math.random() * Math.PI * 2;
            let radius = 0;
            const step = 0.2;
            const spiralFactor = 10;

            let placed = false;

            for (let i = 0; i < 5000; i += 1) {
                word.x = center.x + radius * Math.cos(angle) - word.width / 2;
                word.y = center.y + radius * Math.sin(angle) - word.height / 2;

                if (!checkCollision(word, placedWords)) {
                if (
                    word.x >= 0 &&
                    word.y >= 0 &&
                    word.x + word.width <= width &&
                    word.y + word.height <= height
                ) {
                    placedWords.push(word);
                    placed = true;
                    break;
                }
                }

                angle += step;
                radius = spiralFactor * angle;
            }

            if (!placed && word.fontSize > 20) {
                word.fontSize *= 0.5;
                ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
                metrics = ctx.measureText(word.text);
                word.width = metrics.width;
                word.height = word.fontSize * 0.85;

                angle = Math.random() * Math.PI * 2;
                radius = 0;

                for (let i = 0; i < 5000; i += 1) {
                word.x = center.x + radius * Math.cos(angle) - word.width / 2;
                word.y = center.y + radius * Math.sin(angle) - word.height / 2;

                if (!checkCollision(word, placedWords)) {
                    if (
                    word.x >= 0 &&
                    word.y >= 0 &&
                    word.x + word.width <= width &&
                    word.y + word.height <= height
                    ) {
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

        placedWords.forEach((word) => {
            ctx.font = `bold ${word.fontSize}px "Zen Kaku Gothic New", sans-serif`;
            ctx.fillStyle = word.color;
            ctx.textBaseline = 'top';
            ctx.fillText(word.text, word.x, word.y);
        });

        const link = document.createElement('a');
        link.download = 'wordcloud.png';
        link.href = canvas.toDataURL();
        link.click();
        showSnackbar('単語集画像を保存しました');
    }, [rankingItems, showSnackbar]);

    return {
        handleExportPNG,
        handleExportPDF,
        handleExportText,
        handleExportWordCloud,
    };
};
