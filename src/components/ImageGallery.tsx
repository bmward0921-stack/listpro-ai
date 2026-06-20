import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

const ImageGallery = ({ images, alt = 'Product image', className }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Image */}
      <div
        className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-muted"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={images[selectedIndex]}
          alt={`${alt} ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous image"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 [.group:hover_&]:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next image"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 [.group:hover_&]:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all',
                index === selectedIndex
                  ? 'border-primary ring-1 ring-primary ring-offset-1'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-50"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div
            className="relative flex h-[80vh] w-[90vw] max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIndex]}
              alt={`${alt} ${selectedIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Previous image"
                  className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Next image"
                  className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Lightbox thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-8 flex gap-2">
              {images.map((image, index) => (
                <button
                  key={`lightbox-${image}-${index}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                  className={cn(
                    'h-12 w-12 overflow-hidden rounded border-2 transition-all',
                    index === selectedIndex
                      ? 'border-primary'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img
                    src={image}
                    alt={`${alt} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
