import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useState } from "react";

interface ImageCanvasProps {
  imageUrl: string;
  alt?: string;
}

export default function ImageCanvas({ imageUrl, alt = "Editing canvas" }: ImageCanvasProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const handleFit = () => setZoom(100);

  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06),transparent_62%)]">
      <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-md">
        <img 
          src={imageUrl}
          alt={alt}
          style={{ transform: `scale(${zoom / 100})`, maxWidth: '100%', maxHeight: '70vh' }}
          className="rounded-md object-contain shadow-lg transition-transform duration-200"
          data-testid="img-canvas"
        />
      </div>
      
      <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-lg border bg-background/90 p-1.5 shadow-md backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFit}
          data-testid="button-zoom-fit"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="flex items-center rounded-md bg-muted px-2.5 text-xs font-medium">
          {zoom}%
        </div>
      </div>
    </div>
  );
}
