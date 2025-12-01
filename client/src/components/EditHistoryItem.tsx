import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw, Sparkles, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { HistoryItem } from "./EditHistory";

interface EditHistoryItemProps {
  item: HistoryItem;
  isActive?: boolean;
  isBase?: boolean;
  onSave?: () => void;
  onUseAsBase?: () => void;
}

export default function EditHistoryItem({
  item,
  isActive = false,
  isBase = false,
  onSave,
  onUseAsBase
}: EditHistoryItemProps) {
  const formattedTime = item.createdAt 
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : 'Just now';
  
  const IconComponent = item.isOriginal ? ImageIcon : Sparkles;
  const testIdSuffix = typeof item.id === 'string' ? 'original' : item.id;
  return (
    <Card 
      className={`p-4 hover-elevate cursor-pointer transition-all duration-200 ${
        isActive ? 'ring-2 ring-primary bg-primary/10 shadow-md' : ''
      }`}
      data-testid={`card-edit-${testIdSuffix}`}
    >
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted/50 border">
          <img 
            src={item.thumbnailUrl || item.resultUrl} 
            alt={item.isOriginal ? "Original image" : "Edit preview"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1">
            <div className="flex items-start gap-1.5">
              <IconComponent className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className={`text-sm line-clamp-2 leading-relaxed ${item.isOriginal ? 'font-medium' : 'font-mono'}`} data-testid="text-prompt">
                {item.prompt}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formattedTime}</span>
              {item.isSaved && (
                <Badge variant="secondary" className="text-xs font-normal">Saved</Badge>
              )}
              {isBase && (
                <Badge variant="default" className="text-xs font-normal">Current Base</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className={onSave ? "flex-1 gap-1.5" : "w-full gap-1.5"}
          onClick={onUseAsBase}
          data-testid={`button-use-base-${testIdSuffix}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Use as Base
        </Button>
        {onSave && (
          <Button 
            variant={item.isSaved ? "secondary" : "default"}
            size="sm" 
            className="flex-1 gap-1.5"
            onClick={onSave}
            disabled={item.isSaved}
            data-testid={`button-save-${testIdSuffix}`}
          >
            <Save className="h-3.5 w-3.5" />
            {item.isSaved ? 'Saved' : 'Save'}
          </Button>
        )}
      </div>
    </Card>
  );
}
