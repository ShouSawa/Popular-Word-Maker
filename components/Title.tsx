import React from 'react';

interface TitleProps {
	text: string;
}

const Title: React.FC<TitleProps> = ({ text }) => {
	return (
		<div className="flex justify-center mb-12 mt-4 relative z-20">
			<div className="relative px-12 py-6">
				<div className="absolute inset-0 bg-gradient-to-b from-red-800 to-red-950 rounded-3xl border-[6px] border-double border-yellow-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
					<div className="absolute inset-2 border border-yellow-500/30 rounded-2xl" />
				</div>

				<h1 className="relative text-5xl md:text-7xl font-black text-center tracking-wider z-10">
					<span
						className="absolute inset-0 flex items-center justify-center select-none"
						style={{
							WebkitTextStroke: '10px #B45309',
							color: 'transparent',
						}}
						aria-hidden="true"
					>
						{text}
					</span>

					<span
						className="relative bg-gradient-to-b from-white via-gray-100 to-gray-300 bg-clip-text text-transparent"
						style={{
							filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
						}}
					>
						{text}
					</span>
				</h1>

				<div className="absolute -top-4 -right-4 text-yellow-200 animate-bounce text-4xl z-20">✨</div>
				<div className="absolute -bottom-2 -left-4 text-yellow-200 animate-pulse text-3xl z-20" style={{ animationDelay: '0.7s' }}>
					✨
				</div>
			</div>
		</div>
	);
};

export default Title;
