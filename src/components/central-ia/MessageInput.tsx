import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { SuggestionsPopover } from './SuggestionsPopover';
import { FileUploadButton } from './FileUploadButton';
import { cn } from '../../utils/cn';
import { useScreenDetection } from '../../hooks/useScreenDetection';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  showFileUpload?: boolean;
  onFileSelect?: (file: File) => void;
}

export function MessageInput({
  onSend,
  isLoading,
  placeholder = 'Pergunte algo sobre suas finanças...',
  disabled = false,
  showSuggestions = false,
  showFileUpload = false,
  onFileSelect,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { size } = useScreenDetection();
  const isMobile = size === 'mobile';

  // Auto-resize do textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Focus no input quando componente monta
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || isLoading || disabled) return;

    onSend(message.trim());
    setMessage('');

    // Reset altura
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter para enviar, Shift+Enter para nova linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={cn(
          'flex items-end gap-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60',
          'shadow-sm',
          'transition-all duration-200',
          'focus-within:border-coral-300 focus-within:ring-2 focus-within:ring-coral-100/50',
          'focus-within:shadow-md focus-within:bg-white',
          disabled && 'opacity-50'
        )}
      >
        {/* Botões de ação à esquerda */}
        <div className="flex items-center pl-2 pb-2 gap-1">
          {/* Botão de sugestões */}
          {showSuggestions && (
            <SuggestionsPopover onSelectSuggestion={handleSelectSuggestion} />
          )}

          {/* Botão de upload de arquivo */}
          {showFileUpload && onFileSelect && (
            <FileUploadButton
              onFileSelect={onFileSelect}
              disabled={isLoading || disabled}
            />
          )}
        </div>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          rows={1}
          className={cn(
            'flex-1 py-3 bg-transparent resize-none',
            (showSuggestions || showFileUpload) ? 'pl-1' : 'pl-4',
            isMobile ? 'text-xs' : 'text-sm',
            'text-slate-700 placeholder-slate-400',
            'focus:outline-none',
            'min-h-[48px] max-h-[150px]'
          )}
        />

        {/* Botão de enviar */}
        <motion.button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'm-2 p-2.5 rounded-xl transition-all duration-200',
            message.trim() && !isLoading
              ? 'bg-coral-500 text-white hover:bg-coral-600 shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </form>
  );
}
