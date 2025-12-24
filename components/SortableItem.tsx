import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  text: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, text }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const getFontSize = (text: string) => {
    const length = text.length;
    if (length > 34) return 'text-xs';
    if (length > 30) return 'text-sm';
    if (length > 25) return 'text-base';
    if (length > 19) return 'text-lg';
    return 'text-2xl';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-md shadow-[4px_4px_0px_rgba(0,0,0,0.2)] border border-gray-300 p-3 mb-2 cursor-grab active:cursor-grabbing hover:translate-y-[-2px] transition-transform select-none w-full box-border flex items-center"
    >
      <span className={`sortable-item-text ${getFontSize(text)} text-purple-700 font-bold w-full truncate leading-normal`}>
        {text}
      </span>
    </div>
  );
};