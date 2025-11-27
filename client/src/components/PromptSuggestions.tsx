import SuggestionCard from "./SuggestionCard";
import { Sparkles } from "lucide-react";

interface Suggestion {
  id: number;
  prompt: string;
  category: string;
}

interface PromptSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (prompt: string) => void;
}

export default function PromptSuggestions({ suggestions, onSelect }: PromptSuggestionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Quick Suggestions</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            prompt={suggestion.prompt}
            category={suggestion.category}
            onClick={() => onSelect(suggestion.prompt)}
          />
        ))}
      </div>
    </div>
  );
}
