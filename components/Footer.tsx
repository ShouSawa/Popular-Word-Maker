import React from 'react';
import { Download, FileImage, FileText, Image as ImageIcon } from 'lucide-react';

interface FooterProps {
	onExportPNG: () => void;
	onExportPDF: () => void;
	onExportText: () => void;
	onExportWordCloud: () => void;
}

const Footer: React.FC<FooterProps> = ({
	onExportPNG,
	onExportPDF,
	onExportText,
	onExportWordCloud,
}) => {
	return (
		<div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-4 flex justify-center items-center gap-4 z-50 border-t border-red-900">
			<button
				onClick={onExportPNG}
				className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
			>
				<FileImage size={18} /> PNG保存
			</button>

			<button
				onClick={onExportPDF}
				className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
			>
				<FileText size={18} /> PDF保存
			</button>

			<button
				onClick={onExportText}
				className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
			>
				<Download size={18} /> テキスト保存
			</button>

			<button
				onClick={onExportWordCloud}
				className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
			>
				<ImageIcon size={18} /> 単語集画像保存
			</button>
		</div>
	);
};

export default Footer;
