import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import EditHistoryItem from "./EditHistoryItem";
import { History, Sparkles } from "lucide-react";

export type HistoryItem = {
  id: number | string;
  resultUrl: string;
  thumbnailUrl: string | null;
  prompt: string;
  createdAt: Date | null;
  isSaved: boolean;
  isOriginal: boolean;
};

interface EditHistoryProps {
  historyItems: HistoryItem[];
  activeItemId?: number | string;
  currentBaseId: number | null;
  overwriteLastSave: boolean;
  onOverwriteToggle: (value: boolean) => void;
  onSave: (id: number) => void;
  onUseAsBase: (id: number | string) => void;
}

export default function EditHistory({ 
  historyItems, 
  activeItemId, 
  currentBaseId,
  overwriteLastSave,
  onOverwriteToggle,
  onSave, 
  onUseAsBase 
}: EditHistoryProps) {
  return (
    <div className="flex h-full flex-col bg-card/50">
      <div className="space-y-4 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Edit History</h2>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="overwrite-toggle" className="text-sm font-medium cursor-pointer">
            Overwrite Last Save
          </Label>
          <Switch
            id="overwrite-toggle"
            checked={overwriteLastSave}
            onCheckedChange={onOverwriteToggle}
            data-testid="toggle-overwrite"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {historyItems.length > 0 ? `${historyItems.length - 1} ${historyItems.length - 1 === 1 ? 'edit' : 'edits'} applied` : 'No edits yet'}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {historyItems.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No image uploaded</p>
              <p className="text-xs text-muted-foreground">
                Upload an image to get started
              </p>
            </div>
          ) : (
            historyItems.map((item) => {
              // For original image, currentBaseId === null means it's the base
              // For edits, currentBaseId === item.id means it's the base
              const isBase = item.isOriginal 
                ? currentBaseId === null 
                : currentBaseId === item.id;
              
              return (
                <EditHistoryItem
                  key={item.id}
                  item={item}
                  isActive={item.id === activeItemId}
                  isBase={isBase}
                  onSave={typeof item.id === 'number' ? () => onSave(item.id as number) : undefined}
                  onUseAsBase={() => onUseAsBase(item.id)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
