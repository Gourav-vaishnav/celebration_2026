export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

export interface GalleryItem {
  id: number;
  url: string;
  type: 'image' | 'video';
  alt: string;
}