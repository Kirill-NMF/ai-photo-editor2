import { useState, useRef, useEffect, type KeyboardEvent } from "react";

import { getSliderPositionFromKey } from "@/lib/sliderKeyboard";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  afterPrompt?: string;
}

export default function BeforeAfterSlider({ 
  beforeImage, 
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Edited",
  afterPrompt
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLImageElement>(null);

  // Calculate container height based on image aspect ratio
  useEffect(() => {
    if (!beforeImageRef.current || !containerRef.current) return;

    const img = beforeImageRef.current;
    const container = containerRef.current;
    
    const calculateHeight = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const containerWidth = container.offsetWidth || 800;
      const calculatedHeight = containerWidth / aspectRatio;
      setContainerHeight(calculatedHeight);
    };

    const handleImageLoad = () => {
      calculateHeight();
    };

    // Set up ResizeObserver to recalculate on viewport/parent resize
    const resizeObserver = new ResizeObserver(() => {
      if (img.complete) {
        calculateHeight();
      }
    });
    
    resizeObserver.observe(container);

    if (img.complete) {
      calculateHeight();
    } else {
      img.addEventListener('load', handleImageLoad);
    }

    return () => {
      img.removeEventListener('load', handleImageLoad);
      resizeObserver.disconnect();
    };
  }, [beforeImage]);

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        updateSliderPosition(e.touches[0].clientX);
      }
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    setSliderPosition((current) => getSliderPositionFromKey(current, event.key));
  };

  return (
    <div className="w-full space-y-3">
      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-md bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06),transparent_70%)]"
        style={{ height: containerHeight ? `${containerHeight}px` : 'auto' }}
        data-testid="slider-compare"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* After Image (Base Layer) */}
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 h-full w-full object-contain"
          />
          
          {/* Before Image (Clipped Layer) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              ref={beforeImageRef}
              src={beforeImage}
              alt={beforeLabel}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Slider Line and Handle */}
          <div
            className="group absolute bottom-0 top-0 z-10 w-0.5 touch-none cursor-ew-resize bg-primary shadow-[0_0_0_1px_hsl(var(--background)/0.45)] focus-visible:outline-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onKeyDown={handleKeyDown}
            role="slider"
            tabIndex={0}
            aria-label={`Сравнение изображений: ${beforeLabel} и ${afterLabel}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuetext={`${Math.round(sliderPosition)}% изображения «${beforeLabel}»`}
          >
            {/* Slider Handle */}
            <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg ring-offset-background transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
              <div className="flex gap-1">
                <div className="h-3.5 w-0.5 bg-primary-foreground" />
                <div className="h-3.5 w-0.5 bg-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-3 left-3 z-10 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
            {beforeLabel}
          </div>
          <div className="absolute bottom-3 right-3 z-10 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
            {afterLabel}
          </div>
        </div>
      </div>

      {/* Prompt Display */}
      {afterPrompt && (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm shadow-2xs" data-testid="text-edit-prompt">
          <span className="font-semibold text-foreground">Edit prompt:</span>{" "}
          <span className="text-muted-foreground">{afterPrompt}</span>
        </div>
      )}
    </div>
  );
}
