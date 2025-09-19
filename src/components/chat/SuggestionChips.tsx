import React from 'react';
import { useChat } from '../../store/chat/ChatContext';
import { Suggestion } from '../../types/chat';

const SuggestionChips: React.FC = () => {
  const { state, sendMessage } = useChat();
  
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      sendMessage(suggestion.text);
    }
  };

  if (state.suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3 px-4">
      {state.suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => handleSuggestionClick(suggestion)}
          className="
            bg-gray-100 hover:bg-gray-200
            text-gray-800 text-sm
            px-3 py-1.5 rounded-full
            transition-colors duration-200
            whitespace-nowrap
          "
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
