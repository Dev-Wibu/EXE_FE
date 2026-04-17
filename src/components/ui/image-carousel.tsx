import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: { src: string; alt: string }[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  showControls?: boolean;
  showIndicators?: boolean;
}

export function ImageCarousel({
  images,
  autoPlay = true,
  interval = 4000,
  className,
  showControls = true,
  showIndicators = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!autoPlay || isHovered || images.length <= 1) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, nextSlide, images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-2xl", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((image, index) => (
          <div key={index} className="min-w-full flex-shrink-0">
            <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-[#DCEEFF] to-[#A5C8F2] dark:from-slate-800 dark:to-slate-700">
              {image.src ? (
                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-lg font-medium text-[#0047AB]/50 dark:text-[#66B2FF]/50">
                    Banner {index + 1}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800"
            aria-label="Ảnh trước">
            <ChevronLeft className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800"
            aria-label="Ảnh sau">
            <ChevronRight className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Đi đến ảnh ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
