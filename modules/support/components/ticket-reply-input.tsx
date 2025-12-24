'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSend, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/modules/shared';

interface TicketReplyInputProps {
  onSubmit: (body: string) => void;
  isPending: boolean;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Clean reply input for ticket conversations
 */
export function TicketReplyInput({
  onSubmit,
  isPending,
  disabled = false,
  error,
}: TicketReplyInputProps) {
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [body]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isPending || disabled) return;

    onSubmit(body.trim());
    setBody('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="ticket-reply-area">
      {error && (
        <p className="text-xs text-error mb-3">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          rows={1}
          className="ticket-reply-input"
          disabled={isPending || disabled}
        />
        <Button
          type="submit"
          variant="primary"
          size="iconLg"
          disabled={isPending || disabled || !body.trim()}
          title="Envoyer (Ctrl+Entrée)"
        >
          {isPending ? (
            <IconLoader2 size={18} className="animate-spin" />
          ) : (
            <IconSend size={18} />
          )}
        </Button>
      </form>
    </div>
  );
}
