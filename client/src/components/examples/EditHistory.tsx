import EditHistory from '../EditHistory';
import { useState } from 'react';

export default function EditHistoryExample() {
  const [edits, setEdits] = useState([
    {
      id: 1,
      thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
      prompt: "Make the sky more dramatic with sunset colors",
      createdAt: new Date(),
      resultUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      isSaved: false,
      isOriginal: false,
    },
    {
      id: 2,
      thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
      prompt: "Add warm golden hour lighting",
      createdAt: new Date(),
      resultUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      isSaved: true,
      isOriginal: false,
    },
    {
      id: 3,
      thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
      prompt: "Increase contrast and saturation",
      createdAt: new Date(),
      resultUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      isSaved: false,
      isOriginal: false,
    }
  ]);

  const handleSave = (id: number) => {
    setEdits(edits.map(edit => 
      edit.id === id ? { ...edit, isSaved: true } : edit
    ));
    console.log('Saved edit:', id);
  };

  return (
    <div className="h-screen bg-sidebar">
      <EditHistory
        historyItems={edits}
        activeItemId={1}
        currentBaseId={null}
        overwriteLastSave={false}
        onOverwriteToggle={() => undefined}
        onSave={handleSave}
        onUseAsBase={(id) => console.log('Use as base:', id)}
      />
    </div>
  );
}
