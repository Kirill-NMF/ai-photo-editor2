import EditHistoryItem from '../EditHistoryItem';
import type { HistoryItem } from '../EditHistory';

export default function EditHistoryItemExample() {
  const mockItem1: HistoryItem = {
    id: 1,
    resultUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    prompt: "Make the sky more dramatic with sunset colors",
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
    isSaved: false,
    isOriginal: false,
  };

  const mockItem2: HistoryItem = {
    id: 2,
    resultUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    prompt: "Add warm golden hour lighting",
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    isSaved: true,
    isOriginal: false,
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <EditHistoryItem
        item={mockItem1}
        isActive={true}
        isBase={false}
        onSave={() => console.log('Save clicked')}
        onUseAsBase={() => console.log('Use as base clicked')}
      />
      <EditHistoryItem
        item={mockItem2}
        isActive={false}
        isBase={false}
        onSave={() => console.log('Save clicked')}
        onUseAsBase={() => console.log('Use as base clicked')}
      />
    </div>
  );
}
