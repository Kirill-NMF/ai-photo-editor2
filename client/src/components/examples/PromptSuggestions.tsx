import PromptSuggestions from '../PromptSuggestions';

export default function PromptSuggestionsExample() {
  return (
    <div className="p-8">
      <PromptSuggestions
        onSelect={(prompt) => console.log('Selected:', prompt)}
        onUnlockPremium={() => console.log('Premium requested')}
      />
    </div>
  );
}
