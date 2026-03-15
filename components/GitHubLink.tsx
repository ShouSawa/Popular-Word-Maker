import React from 'react';
import githubMark from '../img/github-mark-white.png';

const GitHubLink: React.FC = () => {
    return (
        <a
            href="https://github.com/ShouSawa/Popular-Word-Maker"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-50 bg-black rounded-full p-1 hover:scale-110 transition-all shadow-lg border border-white/30 flex items-center justify-center"
            title="View on GitHub"
        >
        <img src={githubMark} alt="GitHub" className="w-8 h-8" />
        </a>
    );
};

export default GitHubLink;
