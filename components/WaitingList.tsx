import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WordItem } from '../types/word';
import { Droppable } from './Droppable';
import { SortableItem } from './SortableItem';

interface WaitingListProps {
	items: WordItem[];
	onShuffle: () => void;
}

const WaitingList: React.FC<WaitingListProps> = ({ items, onShuffle }) => {
	return (
		<div className="w-full md:w-80 flex flex-col gap-2">
			<div className="flex items-center justify-between bg-black/40 p-2 rounded-t-lg backdrop-blur-md">
				<span className="text-white font-bold px-2">Waiting List</span>
				<button
					onClick={onShuffle}
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
				<SortableContext id="stack" items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
					<div className="flex flex-col gap-2 min-h-full">
						{items.map((item) => (
							<SortableItem key={item.id} id={item.id} text={item.text} />
						))}

						{items.length === 0 && (
							<div className="h-20 flex items-center justify-center text-gray-400 italic font-bold">
								待機中の単語はありません
							</div>
						)}
					</div>
				</SortableContext>
			</Droppable>
		</div>
	);
};

export default WaitingList;
