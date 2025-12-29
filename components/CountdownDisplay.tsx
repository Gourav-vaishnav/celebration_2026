import React from 'react';
import { TimeLeft } from '../types';

interface CountdownDisplayProps {
  time: TimeLeft;
}

const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center p-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl min-w-[100px] md:min-w-[140px] transition-all hover:bg-white/15 hover:scale-105 duration-300 group">
    <span className="text-4xl md:text-6xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-xs md:text-sm uppercase tracking-widest text-[#f0a3bc] mt-2 font-semibold group-hover:text-white transition-colors">
      {label}
    </span>
  </div>
);

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ time }) => {
  if (time.isComplete) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 z-10 relative animate-fade-in-up">
      <TimeBox value={time.days} label="Days" />
      <TimeBox value={time.hours} label="Hours" />
      <TimeBox value={time.minutes} label="Minutes" />
      <TimeBox value={time.seconds} label="Seconds" />
    </div>
  );
};