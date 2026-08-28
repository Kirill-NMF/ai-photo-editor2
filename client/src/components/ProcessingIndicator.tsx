import { Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingIndicatorProps {
  progress?: number;
  message?: string;
}

export default function ProcessingIndicator({ 
  progress = 0, 
  message = "Generating your edited image..." 
}: ProcessingIndicatorProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-xl sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="font-medium" data-testid="text-processing">
              {message}
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few seconds
            </p>
          </div>
        </div>
        
        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
            <p className="text-xs text-center text-muted-foreground">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
