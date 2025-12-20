"use client";

import { useState, useTransition, useOptimistic } from "react";
import { IconSend, IconTrash, IconMessageOff, IconLoader2 } from "@tabler/icons-react";
import { UserAvatar, ConfirmDialog } from "@/modules/shared";
import { addComment, deleteComment } from "../lib/actions";
import { formatRelativeTime } from "../lib/format";
import type { CommentWithAuthor } from "../types";

interface LeadCommentsProps {
  leadId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  isAdmin: boolean;
}

export function LeadComments({
  leadId,
  comments: initialComments,
  currentUserId,
  isAdmin,
}: LeadCommentsProps) {
  const [isPending, startTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  // Optimistic state for comments
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (
      state: CommentWithAuthor[],
      action:
        | { type: "add"; comment: CommentWithAuthor }
        | { type: "delete"; id: string }
    ) => {
      if (action.type === "add") {
        return [action.comment, ...state];
      }
      if (action.type === "delete") {
        return state.filter((c) => c.id !== action.id);
      }
      return state;
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPending) return;

    setError(null);
    const commentText = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      // Optimistic update
      const tempComment: CommentWithAuthor = {
        id: `temp-${Date.now()}`,
        lead_id: leadId,
        author_id: currentUserId,
        body: commentText,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: { id: currentUserId, display_name: "Vous", avatar: null },
      };
      addOptimisticComment({ type: "add", comment: tempComment });

      const result = await addComment(leadId, commentText);

      if (result.error) {
        setError(result.error);
        setNewComment(commentText); // Restore the comment text on error
      }
    });
  };

  const handleDeleteClick = (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCommentId) return;

    startTransition(async () => {
      addOptimisticComment({ type: "delete", id: deleteCommentId });

      const result = await deleteComment(deleteCommentId);

      if (result.error) {
        setError(result.error);
      } else {
        setDeleteCommentId(null);
      }
    });
  };

  const handleDeleteCancel = () => {
    setDeleteCommentId(null);
  };

  const canDelete = (comment: CommentWithAuthor) => {
    return comment.author_id === currentUserId || isAdmin;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments list - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-md bg-lighterror text-error text-sm">
            {error}
          </div>
        )}

        {optimisticComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-darklink">
            <IconMessageOff size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Aucun commentaire</p>
            <p className="text-xs">Soyez le premier à commenter</p>
          </div>
        ) : (
          optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={canDelete(comment)}
              onDelete={() => handleDeleteClick(comment.id)}
              isPending={isPending}
            />
          ))
        )}
      </div>

      {/* Add comment form - sticky at bottom */}
      <div className="shrink-0 border-t border-ld p-4 bg-white dark:bg-dark">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={2}
            className="form-control-input flex-1 resize-none"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !newComment.trim()}
            className="ui-button bg-primary text-white h-10 w-10 p-0 shrink-0 disabled:opacity-50 flex items-center justify-center"
            title="Envoyer"
          >
            {isPending ? (
              <IconLoader2 size={18} className="animate-spin" />
            ) : (
              <IconSend size={18} />
            )}
          </button>
        </form>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteCommentId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le commentaire"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={isPending}
      />
    </div>
  );
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  canDelete: boolean;
  onDelete: () => void;
  isPending: boolean;
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
  isPending,
}: CommentItemProps) {
  const isTemp = comment.id.startsWith("temp-");
  const authorName = comment.author?.display_name || "Utilisateur inconnu";

  return (
    <div className={`comment-bubble ${isTemp ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <UserAvatar name={authorName} avatar={comment.author?.avatar} size="lg" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-ld">{authorName}</span>
            <span className="text-xs text-darklink">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-ld whitespace-pre-wrap wrap-break-word">
            {comment.body}
          </p>
        </div>

        {/* Delete button */}
        {canDelete && !isTemp && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="shrink-0 p-1 text-darklink hover:text-error transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <IconTrash size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
