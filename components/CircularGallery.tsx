import React, { useState, useMemo } from 'react';
import { GalleryImage } from '../types';
import { X, ImageOff } from 'lucide-react';

interface CircularGalleryProps {
  images: GalleryImage[];
}

// Sub-component to handle individual image loading state
const GalleryItem: React.FC<{ 
  img: GalleryImage; 
  onSelect: (img: GalleryImage) => void; 
}> = ({ img, onSelect }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      onClick={() => onSelect(img)}
      className="w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 cursor-pointer transition-transform hover:z-50 hover:scale-110 duration-300 group"
    >
      <div className={`w-full h-full rounded-2xl overflow-hidden border-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 ${
        hasError 
          ? 'bg-red-900/40 border-red-500/50 flex flex-col items-center justify-center text-center p-2' 
          : 'bg-white/5 border-white/20 group-hover:border-white/40 group-hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]'
      }`}>
        {hasError ? (
          <>
            <ImageOff className="w-8 h-8 text-red-300 mb-1" />
            <span className="text-[10px] text-red-200 font-mono break-all leading-tight">
              Missing:<br/>
              {img.url.split('/').pop()}
            </span>
          </>
        ) : (
          <img
            src={img.url}
            alt={img.alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
};

export const CircularGallery: React.FC<CircularGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Memoize positions to ensure stability across re-renders
  const scatteredImages = useMemo(() => {
    const count = images.length;
    
    return images.map((img, index) => {
      // 1. Calculate base angle for even distribution (0 to 2PI)
      const angleStep = (2 * Math.PI) / count;
      const baseAngle = index * angleStep;

      // 2. Add randomness (Jitter)
      const angleJitter = (Math.random() - 0.5) * 0.6; 
      const angle = baseAngle + angleJitter;

      // 3. Randomize Radius (Keep text visible)
      const minR = 30;
      const maxR = 42;
      const radius = minR + Math.random() * (maxR - minR);

      // 4. Convert Polar to Cartesian percentages
      const left = 50 + radius * Math.cos(angle);
      const top = 50 + radius * Math.sin(angle);

      // 5. Randomize Animation
      const animType = (index % 3) + 1; // 1, 2, or 3
      const delay = Math.random() * -5;

      return {
        ...img,
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
  }, [images]);

  return (
    <>
      <div className="absolute inset-0 w-full h-full overflow-hidden animate-enter-display pointer-events-none">
        
        {/* Floating Images Container */}
        <div className="absolute inset-0 pointer-events-auto">
          {scatteredImages.map((img) => (
            <div
              key={img.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={img.wrapperStyle}
            >
              <div
                className={`${img.animClass}`}
                style={img.animStyle}
              >
                <GalleryItem img={img} onSelect={setSelectedImage} />
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
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative w-full max-w-md max-h-[80vh] aspect-square bg-slate-900/80 rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white transition-all backdrop-blur-sm"
              aria-label="Close image"
            >
              <X size={20} />
            </button>

            {/* Large Image */}
            <img 
              src={selectedImage.url} 
              alt={selectedImage.alt} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
};