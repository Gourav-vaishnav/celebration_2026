import React, { useState, useMemo } from 'react';
import { GalleryItem } from '../types';
import { X, ImageOff, Play } from 'lucide-react';

interface CircularGalleryProps {
  items: GalleryItem[];
}

// Sub-component to handle individual media loading state
const GalleryMedia: React.FC<{ 
  item: GalleryItem; 
  onSelect: (item: GalleryItem) => void; 
}> = ({ item, onSelect }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      onClick={() => onSelect(item)}
      className="w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 cursor-pointer transition-transform hover:z-50 hover:scale-110 duration-300 group"
    >
      <div className={`w-full h-full rounded-2xl overflow-hidden border-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 relative ${
        hasError 
          ? 'bg-red-900/40 border-red-500/50 flex flex-col items-center justify-center text-center p-2' 
          : 'bg-white/5 border-white/20 group-hover:border-white/40 group-hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]'
      }`}>
        {hasError ? (
          <>
            <ImageOff className="w-8 h-8 text-red-300 mb-1" />
            <span className="text-[10px] text-red-200 font-mono break-all leading-tight">
              Error:<br/>
              {item.url.split('/').pop()}
            </span>
          </>
        ) : (
          <>
            {item.type === 'video' ? (
              <>
                <video
                  src={item.url}
                  muted
                  loop
                  autoPlay
                  playsInline
                  onError={() => setHasError(true)}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                   <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm">
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                   </div>
                </div>
              </>
            ) : (
              <img
                src={item.url}
                alt={item.alt}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const CircularGallery: React.FC<CircularGalleryProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Memoize positions to ensure stability across re-renders
  const scatteredItems = useMemo(() => {
    const count = items.length;
    
    return items.map((item, index) => {
      // 1. Calculate base angle for even distribution (0 to 2PI)
      const angleStep = (2 * Math.PI) / count;
      const baseAngle = index * angleStep;

      // 2. Add randomness (Jitter)
      const angleJitter = (Math.random() - 0.5) * 0.4; // Reduced jitter for higher counts
      const angle = baseAngle + angleJitter;

      // 3. Randomize Radius (Keep text visible)
      // Slightly expanded radius range to accommodate more items
      const minR = 25; 
      const maxR = 45;
      const radius = minR + Math.random() * (maxR - minR);

      // 4. Convert Polar to Cartesian percentages
      const left = 50 + radius * Math.cos(angle);
      const top = 50 + radius * Math.sin(angle);

      // 5. Randomize Animation
      const animType = (index % 3) + 1; // 1, 2, or 3
      const delay = Math.random() * -5;

      return {
        ...item,
        wrapperStyle: {
          top: `${top}%`,
          left: `${left}%`,
        },
        animStyle: {
          animationDelay: `${delay}s`
        },
        animClass: `animate-float-${animType}`
      };
    });
  }, [items]);

  return (
    <>
      <div className="absolute inset-0 w-full h-full overflow-hidden animate-enter-display pointer-events-none">
        
        {/* Floating Items Container */}
        <div className="absolute inset-0 pointer-events-auto">
          {scatteredItems.map((item) => (
            <div
              key={item.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={item.wrapperStyle}
            >
              <div
                className={`${item.animClass}`}
                style={item.animStyle}
              >
                <GalleryMedia item={item} onSelect={setSelectedItem} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Centerpiece Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center animate-pulse">
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-500 drop-shadow-[0_0_30px_rgba(253,224,71,0.6)]">
              2026
            </h1>
            <p className="text-2xl md:text-3xl text-yellow-100 font-light tracking-[0.5em] mt-4 uppercase drop-shadow-md">
              Happy New Year
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox / Modal Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] aspect-video bg-slate-900/80 rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white transition-all backdrop-blur-sm"
              aria-label="Close media"
            >
              <X size={20} />
            </button>

            {/* Media Content */}
            {selectedItem.type === 'video' ? (
              <video 
                src={selectedItem.url} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            ) : (
              <img 
                src={selectedItem.url} 
                alt={selectedItem.alt} 
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};