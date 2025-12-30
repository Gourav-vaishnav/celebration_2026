import React, { useState, useRef, Suspense, lazy, useEffect } from 'react';
import { useCountdown } from './hooks/useCountdown';
import { GalleryItem } from './types';
import { Upload, Music, Image as ImageIcon, PlayCircle, Volume2, VolumeX, Loader2, Eye, EyeOff, Film, Download, Square, Video, MessageSquare } from 'lucide-react';

// Lazy Load Components
// Using named import pattern for CircularGallery and CountdownDisplay
const CircularGallery = lazy(() => import('./components/CircularGallery').then(module => ({ default: module.CircularGallery })));
const CountdownDisplay = lazy(() => import('./components/CountdownDisplay').then(module => ({ default: module.CountdownDisplay })));
const GoldenFireworks = lazy(() => import('./components/GoldenFireworks'));

const App: React.FC = () => {
  const timeLeft = useCountdown();
  
  // State for user uploads
  const [userMedia, setUserMedia] = useState<GalleryItem[]>([]);
  const [bgMusic, setBgMusic] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("I LOVE YOU\nJAANU");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Sequence States
  const [showLoveMessage, setShowLoveMessage] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Audio Reference
  const audioRef = useRef<HTMLAudioElement>(null);

  // Celebration triggers if time is up OR preview mode is active
  const isCelebrationTime = (timeLeft.isComplete || isPreviewMode) && isSetupComplete;

  // ---------------------------------------------------------------------------
  // AUDIO CONTROLLER
  // ---------------------------------------------------------------------------
  // Handle automatic audio start/stop based on celebration state
  useEffect(() => {
    if (!audioRef.current || !bgMusic) return;

    if (isCelebrationTime) {
      // Condition 1 & 2: Start song when clock hits 0 OR Preview is pressed
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => console.log("Audio autoplay prevented:", error));
      }
    } else {
      // Stop song if celebration ends (e.g. exit preview)
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isCelebrationTime, bgMusic]);

  // ---------------------------------------------------------------------------
  // SEQUENCE CONTROLLER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Reset states if we exit celebration mode
    if (!isCelebrationTime) {
      setShowLoveMessage(false);
      setIsSlideshowActive(false);
      setCurrentSlideIndex(0);
      setLoopCount(0);
      return;
    }

    // Step 1: Show Love Message for 3 seconds
    setShowLoveMessage(true);
    
    const messageTimer = setTimeout(() => {
      setShowLoveMessage(false);
      // Step 2: Start Slideshow after message disappears
      if (userMedia.length > 0) {
        setIsSlideshowActive(true);
      }
    }, 3000);

    return () => clearTimeout(messageTimer);
  }, [isCelebrationTime, userMedia.length]);

  // ---------------------------------------------------------------------------
  // SLIDESHOW LOGIC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let slideTimer: ReturnType<typeof setInterval>;

    if (isSlideshowActive && userMedia.length > 0) {
      slideTimer = setInterval(() => {
        setCurrentSlideIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          
          // Check if we reached the end of the media list
          if (nextIndex >= userMedia.length) {
            // Check if we finished 1 loop (sequence runs once)
            setLoopCount((prevLoop) => {
              const newLoop = prevLoop + 1;
              if (newLoop >= 1) {
                // Sequence Complete: Stop slideshow, show Circular Gallery
                setIsSlideshowActive(false);
                return 0; 
              }
              return newLoop;
            });
            return 0; // Reset to first image for next loop
          }
          
          return nextIndex;
        });
      }, 2000); // 2 Second Pause
    }

    return () => clearInterval(slideTimer);
  }, [isSlideshowActive, userMedia.length]);

  // ---------------------------------------------------------------------------
  // RECORDING LOGIC
  // ---------------------------------------------------------------------------
  const handleStartRecording = async () => {
    try {
      // 1. Request Screen & Audio Permissions
      // Note: 'system' audio capture availability depends on browser/OS (works best on Chrome/Edge on Desktop)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true // Request audio capture
      });

      // 2. Setup Media Recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      // 3. Handle Data Availability
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // 4. Handle Stop Event (Download)
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `new-year-celebration-${Date.now()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Stop all tracks to clear the red "recording" icon in browser tab
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      // 5. Start Recording
      mediaRecorder.start();
      setIsRecording(true);

      // Handle case where user stops recording via browser UI float bar
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

    } catch (err) {
      console.error("Error starting screen recording:", err);
      alert("Could not start recording. Please ensure you granted permission to share the screen and audio.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle Media Uploads (Images & Videos)
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array and create Blob URLs
      const newItems: GalleryItem[] = Array.from(files).slice(0, 30).map((file: any, index) => ({
        id: index,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        alt: file.name
      }));
      setUserMedia(newItems);
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
    if (userMedia.length > 0) {
      setIsSetupComplete(true);
      
      // "Prime" the audio context:
      // Play and immediately pause the audio to unlock browser autoplay restrictions.
      // This ensures that when the timer hits 0 or preview is clicked, we can play programmatically.
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audioRef.current?.pause();
              audioRef.current!.currentTime = 0;
            })
            .catch(e => console.log("Audio unlock failed (will try again later):", e));
        }
      }
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

  // Toggle Preview Mode
  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // ---------------------------------------------------------------------------
  // 1. SETUP SCREEN
  // ---------------------------------------------------------------------------
  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center overflow-y-auto bg-gradient-to-br from-[#397754] via-[#9b45b2] to-[#eb6b40] text-white p-4 font-sans">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500 my-auto">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f0a3bc] to-[#eb6b40] mb-2">
              New Year 2026 Setup
            </h1>
            <p className="text-[#f0a3bc] text-sm">Customize your countdown experience</p>
          </div>

          <div className="space-y-6">
            {/* Media Upload Section */}
            <div className={`p-6 rounded-2xl border transition-all ${userMedia.length > 0 ? 'bg-[#70be51]/20 border-[#70be51]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#397754]/40 rounded-lg text-[#70be51]">
                    <div className="flex gap-1">
                      <ImageIcon size={20} />
                      <Film size={20} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">1. Select Media</h3>
                    <p className="text-xs text-white/60">Choose up to 30 photos or videos</p>
                  </div>
                </div>
                {userMedia.length > 0 && (
                  <span className="text-xs font-bold text-[#397754] bg-[#70be51] px-2 py-1 rounded-full">
                    {userMedia.length} Selected
                  </span>
                )}
              </div>
              
              <label className="flex items-center justify-center w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl cursor-pointer transition-all group">
                <span className="flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white">
                  <Upload size={16} />
                  {userMedia.length > 0 ? 'Change Media' : 'Upload Photos/Videos'}
                </span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleMediaUpload}
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

            {/* Custom Message Section */}
            <div className={`p-6 rounded-2xl border transition-all ${customMessage ? 'bg-[#eb6b40]/20 border-[#eb6b40]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#eb6b40]/40 rounded-lg text-[#ffccbc]">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">3. Celebration Message</h3>
                    <p className="text-xs text-white/60">Message shown when clock hits zero</p>
                  </div>
                </div>
              </div>
              
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full h-24 bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-[#eb6b40] focus:ring-1 focus:ring-[#eb6b40] transition-all resize-none text-center font-bold"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={userMedia.length === 0}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                userMedia.length > 0
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
          className="hidden" 
        />
      )}

      {/* Special Message Overlay */}
      {showLoveMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-700">
             <h1 className="text-5xl md:text-8xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-[#f0a3bc] via-white to-[#eb6b40] drop-shadow-[0_0_30px_rgba(235,107,64,0.8)] scale-110 animate-pulse tracking-tighter px-4 leading-tight whitespace-pre-line">
              {customMessage}
            </h1>
        </div>
      )}

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f0a3bc]/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#70be51]/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Golden Fireworks Background (Celebration Only) */}
      {isCelebrationTime && (
        <Suspense fallback={null}>
          <GoldenFireworks />
        </Suspense>
      )}

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-3 flex-wrap justify-end">
        {/* Recording Toggle Button */}
         <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-all cursor-pointer group backdrop-blur-md ${
            isRecording 
              ? 'bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30' 
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title={isRecording ? "Stop Recording & Download" : "Record Celebration"}
        >
          {isRecording ? (
            <>
              <Square size={14} className="fill-current animate-pulse" />
              <span className="text-xs font-medium hidden md:block">Stop</span>
            </>
          ) : (
            <>
              <Video size={14} />
              <span className="text-xs font-medium hidden md:block">Record</span>
            </>
          )}
        </button>

        {/* Preview Toggle Button */}
        <button
          onClick={togglePreview}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-all cursor-pointer group backdrop-blur-md ${
            isPreviewMode ? 'bg-white/20 border-white/40 text-white shadow-lg shadow-white/10' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title={isPreviewMode ? "Exit Preview" : "Preview Celebration"}
        >
          {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="text-xs font-medium hidden md:block">
            {isPreviewMode ? "Exit Preview" : "Preview"}
          </span>
        </button>

        {/* Audio Toggle Button */}
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
      </div>

      {/* 
        DISPLAY LOGIC:
        1. Not Celebration -> Countdown
        2. Celebration + Slideshow Active -> Slideshow
        3. Celebration + Slideshow Done -> Circular Gallery
      */}
      
      {!isCelebrationTime ? (
        // COUNTDOWN STATE
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <h1 className="text-xl md:text-3xl font-light text-[#f0a3bc] mb-8 tracking-[0.5em] uppercase text-center opacity-90 drop-shadow-md">
            Counting Down To
          </h1>
          <div className="mb-12">
              <h2 className="text-6xl md:text-8xl font-black text-white text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tight">
                2026
              </h2>
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-white/50 w-8 h-8" />
            </div>
          }>
            <CountdownDisplay time={timeLeft} />
          </Suspense>
        </div>
      ) : isSlideshowActive && !showLoveMessage ? (
        // SLIDESHOW STATE (Runs 1 loop)
        <div className="relative z-20 w-full h-full flex items-center justify-center p-8">
           <div className="relative w-full max-w-5xl aspect-video md:aspect-auto md:h-[80vh] bg-white/5 border border-white/20 rounded-3xl backdrop-blur-md shadow-2xl overflow-hidden flex items-center justify-center">
              {userMedia.map((media, index) => {
                if (index !== currentSlideIndex) return null;
                return (
                  <div key={`${media.id}-${loopCount}`} className="w-full h-full animate-slide-in-right">
                    {media.type === 'video' ? (
                       <video 
                        src={media.url} 
                        className="w-full h-full object-contain"
                        preload="metadata"
                        autoPlay
                        muted
                        loop
                        playsInline
                       />
                    ) : (
                      <img 
                        src={media.url} 
                        alt={media.alt} 
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    )}
                    {/* Counter pill */}
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono text-white/70">
                      {index + 1}/{userMedia.length}
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      ) : (
        // DEFAULT CELEBRATION STATE (Circular Gallery)
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-white w-12 h-12" />
          </div>
        }>
          <CircularGallery items={userMedia} />
        </Suspense>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-[10px] md:text-xs uppercase tracking-widest pointer-events-none">
        {isCelebrationTime ? "Welcome to the Future" : "Time is ticking"}
      </div>
    </div>
  );
};

export default App;