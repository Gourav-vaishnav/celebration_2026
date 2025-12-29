import React, { useMemo } from 'react';

const GoldenFireworks: React.FC = () => {
  // Create stable random values for the particles
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`, // Random vertical position
      delay: `${Math.random() * 5}s`, // Random start time
      duration: `${3 + Math.random() * 4}s`, // Random speed
      scale: 0.5 + Math.random(), // Random size
      opacity: 0.4 + Math.random() * 0.6
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-0 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_15px_4px_rgba(251,191,36,0.6)] animate-gold-drift"
          style={{
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
            transform: `scale(${p.scale})`
          }}
        >
          {/* Add a trail effect */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-400/50 -translate-x-full" />
        </div>
      ))}
    </div>
  );
};

export default GoldenFireworks;