import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface SuggestionCardProps {
  prompt: string;
  category?: string;
  onClick: () => void;
}

export default function SuggestionCard({ prompt, category, onClick }: SuggestionCardProps) {
  const categoryIconColors: Record<string, string> = {
    lighting: "text-yellow-500",
    color: "text-purple-500",
    style: "text-blue-500",
    effects: "text-green-500",
    default: "text-primary"
  };

  const iconColor = category ? categoryIconColors[category] || categoryIconColors.default : categoryIconColors.default;

  return (
    <Card 
      className="p-3 cursor-pointer hover-elevate active-elevate-2"
      onClick={onClick}
      data-testid="card-suggestion"
    >
      <div className="flex items-start gap-2">
        <Sparkles className={`h-4 w-4 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm leading-snug line-clamp-2">{prompt}</p>
          {category && (
            <span className="text-xs text-muted-foreground capitalize">{category}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
