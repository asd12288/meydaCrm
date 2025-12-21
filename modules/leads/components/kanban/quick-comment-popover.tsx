'use client';

import { useState, useTransition } from 'react';
import { IconSend, IconMessageCircle } from '@tabler/icons-react';
import { useToast, Spinner } from '@/modules/shared';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { addComment } from '../../lib/actions';

interface QuickCommentPopoverProps {
  leadId: string;
  leadName: string;
}

export function QuickCommentPopover({
  leadId,
  leadName,
}: QuickCommentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!comment.trim()) return;

    const commentText = comment.trim();
    setComment('');
    setOpen(false); // Close immediately

    startTransition(async () => {
      const result = await addComment(leadId, commentText);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Commentaire ajouté');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Prevent card drag when typing
    e.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setOpen(true);
                }
              }}
              className={`
                flex h-7 w-7 items-center justify-center rounded-md border
                bg-white dark:bg-darkgray border-border dark:border-darkborder
                text-darklink hover:bg-lightgray dark:hover:bg-darkmuted
                cursor-pointer transition-all duration-150
                ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
            >
              <IconMessageCircle size={14} />
            </div>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Ajouter un commentaire</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-80 p-4"
        align="start"
        side="right"
        sideOffset={8}
        collisionPadding={20}
        avoidCollisions={true}
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="text-sm font-medium text-ld">
            Commentaire pour {leadName}
          </div>

          {/* Textarea */}
          <Textarea
            placeholder="Ajouter un commentaire rapide..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none text-sm"
            disabled={isPending}
            autoFocus
          />

          {/* Footer with submit button */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-darklink">
              Ctrl+Enter pour envoyer
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!comment.trim() || isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Spinner size="sm" />
                  Envoi...
                </>
              ) : (
                <>
                  <IconSend size={14} />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
