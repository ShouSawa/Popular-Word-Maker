import React from 'react';

interface InputAreaProps {
	value: string;
	onChange: (value: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ value, onChange }) => {
	return (
		<div className="w-full bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border-2 border-red-900/30">
			<label className="block text-red-900 font-bold mb-2">エントリー単語 (1行1単語)</label>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full h-32 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none font-medium"
				placeholder="ここに単語を入力してください..."
			/>
		</div>
	);
};

export default InputArea;
