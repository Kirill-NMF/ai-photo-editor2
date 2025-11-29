import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Sparkles } from "lucide-react";

interface GalleryItemProps {
  id: number;
  thumbnailUrl: string;
  prompt: string;
  createdAt: string;
  onClick: () => void;
  isAboveFold?: boolean;
}

export default function GalleryItem({ id, thumbnailUrl, prompt, createdAt, onClick, isAboveFold = false }: GalleryItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover-elevate active-elevate-2 hover:shadow-lg"
      onClick={onClick}
      data-testid={`card-gallery-${id}`}
    >
      <div className="aspect-square relative overflow-hidden bg-muted/50">
        <div className={`relative w-full h-full ${!isLoaded ? 'bg-muted animate-pulse' : ''}`}>
          <img 
            src={thumbnailUrl} 
            alt={prompt}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={isAboveFold ? "eager" : "lazy"}
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full border border-border/50 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">View Details</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-mono line-clamp-2 leading-relaxed text-foreground/90" data-testid="text-prompt">
            {prompt}
          </p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="text-xs font-normal">
            {createdAt}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
