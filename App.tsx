import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCountdown } from './hooks/useCountdown';
import { CountdownDisplay } from './components/CountdownDisplay';
import { CircularGallery } from './components/CircularGallery';
import { GalleryImage } from './types';
import { Eye, EyeOff, Upload, Music, Image as ImageIcon, PlayCircle, Volume2, VolumeX } from 'lucide-react';

// Component for the Golden Light Fireworks
const GoldenFireworks = () => {
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

const App: React.FC = () => {
  const timeLeft = useCountdown();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // State for user uploads
  const [userImages, setUserImages] = useState<GalleryImage[]>([]);
  const [bgMusic, setBgMusic] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string>("");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio Reference
  const audioRef = useRef<HTMLAudioElement>(null);

  // Celebration triggers if time is up OR preview mode is active
  const isCelebrationTime = (timeLeft.isComplete || isPreviewMode) && isSetupComplete;

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewMode(prev => !prev);
  };

  // Handle Image Uploads
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array and create Blob URLs
      const newImages: GalleryImage[] = Array.from(files).slice(0, 11).map((file, index) => ({
        id: index,
        url: URL.createObjectURL(file),
        alt: file.name
      }));
      setUserImages(newImages);
    }
  };

  // Handle Audio Upload
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBgMusic(URL.createObjectURL(file));
      setMusicName(file.name);
    }
  };

  // Start the App
  const handleStart = () => {
    if (userImages.length > 0) {
      setIsSetupComplete(true);
      // Attempt to play audio immediately after user interaction to satisfy browser autoplay policies
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.log("Audio autoplay prevented:", e));
        }
      }, 100);
    }
  };

  // Toggle Audio Playback
  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ---------------------------------------------------------------------------
  // 1. SETUP SCREEN
  // ---------------------------------------------------------------------------
  if (!isSetupComplete) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#397754] via-[#9b45b2] to-[#eb6b40] text-white p-4 font-sans">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f0a3bc] to-[#eb6b40] mb-2">
              New Year 2026 Setup
            </h1>
            <p className="text-[#f0a3bc] text-sm">Customize your countdown experience</p>
          </div>

          <div className="space-y-6">
            {/* Image Upload Section */}
            <div className={`p-6 rounded-2xl border transition-all ${userImages.length > 0 ? 'bg-[#70be51]/20 border-[#70be51]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#397754]/40 rounded-lg text-[#70be51]">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">1. Select Photos</h3>
                    <p className="text-xs text-white/60">Choose your 11 favorite memories</p>
                  </div>
                </div>
                {userImages.length > 0 && (
                  <span className="text-xs font-bold text-[#397754] bg-[#70be51] px-2 py-1 rounded-full">
                    {userImages.length} Selected
                  </span>
                )}
              </div>
              
              <label className="flex items-center justify-center w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl cursor-pointer transition-all group">
                <span className="flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white">
                  <Upload size={16} />
                  {userImages.length > 0 ? 'Change Photos' : 'Upload Images'}
                </span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Audio Upload Section */}
            <div className={`p-6 rounded-2xl border transition-all ${bgMusic ? 'bg-[#9b45b2]/20 border-[#9b45b2]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#9b45b2]/40 rounded-lg text-[#f0a3bc]">
                    <Music size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">2. Background Music</h3>
                    <p className="text-xs text-white/60">Select a song (Auto-loops)</p>
                  </div>
                </div>
                {bgMusic && (
                  <span className="text-xs font-bold text-white bg-[#9b45b2] px-2 py-1 rounded-full max-w-[100px] truncate">
                    Ready
                  </span>
                )}
              </div>

              <label className="flex items-center justify-center w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl cursor-pointer transition-all group">
                <span className="flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white">
                  <Upload size={16} />
                  {bgMusic ? 'Change Song' : 'Upload Song'}
                </span>
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={handleAudioUpload}
                />
              </label>
              {musicName && <p className="text-center text-xs text-white/60 mt-2 truncate">{musicName}</p>}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={userImages.length === 0}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                userImages.length > 0
                  ? 'bg-gradient-to-r from-[#eb6b40] to-[#9b45b2] hover:scale-[1.02] hover:shadow-[#eb6b40]/50 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PlayCircle size={24} />
              Start Countdown
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN APP
  // ---------------------------------------------------------------------------
  return (
    <div 
      className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#397754] via-[#9b45b2] to-[#eb6b40]"
    >
      {/* Background Audio Player (Hidden) */}
      {bgMusic && (
        <audio 
          ref={audioRef}
          src={bgMusic} 
          loop 
          autoPlay 
          className="hidden" 
        />
      )}

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f0a3bc]/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#70be51]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Golden Fireworks Background (Celebration Only) */}
      {isCelebrationTime && <GoldenFireworks />}

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-3">
        {bgMusic && (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer group backdrop-blur-md"
            title={isPlaying ? "Mute Music" : "Play Music"}
          >
            {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="text-xs font-medium max-w-[100px] truncate hidden md:block">{musicName}</span>
          </button>
        )}
        <button
          onClick={togglePreview}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-medium transition-all backdrop-blur-md ${
            isPreviewMode 
              ? 'bg-[#eb6b40]/20 border-[#eb6b40] text-[#f0a3bc] shadow-[0_0_15px_rgba(235,107,64,0.3)]' 
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPreviewMode ? 'Exit Preview' : 'Preview Celebration'}
        </button>
      </div>

      {/* Main Display Logic */}
      {!isCelebrationTime ? (
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <h1 className="text-xl md:text-3xl font-light text-[#f0a3bc] mb-8 tracking-[0.5em] uppercase text-center opacity-90 drop-shadow-md">
            Counting Down To
          </h1>
          <div className="mb-12">
              <h2 className="text-6xl md:text-8xl font-black text-white text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tight">
                2026
              </h2>
          </div>
          <CountdownDisplay time={timeLeft} />
        </div>
      ) : (
        <CircularGallery images={userImages} />
      )}

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-[10px] md:text-xs uppercase tracking-widest pointer-events-none">
        {isCelebrationTime ? "Welcome to the Future" : "Time is ticking"}
      </div>
    </div>
  );
};

export default App;