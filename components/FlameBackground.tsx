import React, { useEffect, useState } from 'react';

// Generates random particles for the fire effect
const FlameBackground: React.FC = () => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Generate a fixed number of particles
    const particleCount = 30;
    setParticles(Array.from({ length: particleCount }, (_, i) => i));
  }, []);

  return (
    <div className="fire-bg">
      {particles.map((i) => {
        const size = Math.random() * 20 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 5 + 3;
        const delay = Math.random() * 5;
        
        return (
          <div
            key={i}
            className="particle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default FlameBackground;