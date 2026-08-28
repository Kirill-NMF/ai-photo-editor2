import PromptInput from '../PromptInput';
import { useState } from 'react';

export default function PromptInputExample() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = (prompt: string) => {
    console.log('Prompt:', prompt);
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PromptInput value={value} onChange={setValue} onSubmit={handleSubmit} isProcessing={isProcessing} />
    </div>
  );
}
