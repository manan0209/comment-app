'use client';

import { api, Comment, UpdateCommentData } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
    ArrowUturnLeftIcon,
    ChatBubbleLeftIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import moment from 'moment';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CommentForm } from './CommentForm';
import { LoadingSpinner } from './LoadingSpinner';

interface CommentItemProps {
  comment: Comment;
  onCommentCreated: (comment: Comment) => void;
  onCommentUpdated: (comment: Comment) => void;
  level?: number;
}

interface EditFormData {
  content: string;
}

export const CommentItem = ({ 
  comment, 
  onCommentCreated, 
  onCommentUpdated, 
  level = 0 
}: CommentItemProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    defaultValues: { content: comment.content }
  });

  const isOwner = user?.id === comment.authorId;
  const canEdit = isOwner && comment.canEdit;
  const canRestore = isOwner && comment.canRestore;
  const canDelete = isOwner && !comment.isDeleted;

  const handleEdit = async (data: EditFormData) => {
    setLoading(true);
    try {
      const updateData: UpdateCommentData = { content: data.content };
      const response = await api.put(`/comments/${comment.id}`, updateData);
      onCommentUpdated(response.data);
      setIsEditing(false);
      toast.success('Comment updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setLoading(true);
    try {
      const response = await api.delete(`/comments/${comment.id}`);
      onCommentUpdated(response.data);
      toast.success('Comment deleted successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/comments/${comment.id}/restore`);
      onCommentUpdated(response.data);
      toast.success('Comment restored successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to restore comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeInfo = () => {
    const createdAt = moment(comment.createdAt);
    const now = moment();
    const diffMinutes = now.diff(createdAt, 'minutes');
    
    let timeText = createdAt.fromNow();
    if (comment.isEdited) {
      timeText += ' (edited)';
    }
    
    if (canEdit && diffMinutes < 15) {
      const remainingMinutes = 15 - diffMinutes;
      timeText += ` • ${remainingMinutes}min left to edit`;
    }
    
    return timeText;
  };

  const marginLeft = Math.min(level * 2, 8);

  return (
    <div 
      className="animate-fade-in"
      style={{ marginLeft: `${marginLeft}rem` }}
    >
      <div className={`bg-dark-surface border border-dark-border rounded-lg p-4 ${
        comment.isDeleted ? 'opacity-60' : ''
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-dark-accent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {comment.author?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-dark-text">
                {comment.author?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-dark-textSecondary">
                {renderTimeInfo()}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center space-x-2">
              {loading && <LoadingSpinner />}
              
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-dark-textSecondary hover:text-dark-text transition-colors"
                  title="Edit comment"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-1 text-dark-textSecondary hover:text-dark-error transition-colors disabled:opacity-50"
                  title="Delete comment"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}

              {canRestore && (
                <button
                  onClick={handleRestore}
                  disabled={loading}
                  className="p-1 text-dark-textSecondary hover:text-dark-success transition-colors disabled:opacity-50"
                  title="Restore comment"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          {isEditing ? (
            <form onSubmit={handleSubmit(handleEdit)} className="space-y-3">
              <textarea
                {...register('content', {
                  required: 'Comment cannot be empty',
                  minLength: { value: 1, message: 'Comment cannot be empty' },
                  maxLength: { value: 2000, message: 'Comment cannot exceed 2000 characters' },
                })}
                rows={3}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent resize-none"
              />
              {errors.content && (
                <p className="text-sm text-dark-error">{errors.content.message}</p>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-dark-accent hover:bg-dark-accentHover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <LoadingSpinner />}
                  <span>Save</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    reset({ content: comment.content });
                  }}
                  className="px-4 py-2 text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              {comment.isDeleted ? (
                <p className="text-dark-textSecondary italic">
                  This comment has been deleted
                  {canRestore && (
                    <span className="ml-2">
                      • You can restore it within 15 minutes
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-dark-text whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          )}
        </div>

        {!comment.isDeleted && !isEditing && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center space-x-1 text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>Reply</span>
            </button>

            {comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} 
                {comment.replies.length === 1 ? ' reply' : ' replies'}
              </button>
            )}
          </div>
        )}

        {showReplyForm && !comment.isDeleted && (
          <div className="mt-4 border-t border-dark-border pt-4">
            <CommentForm
              onCommentCreated={(newComment) => {
                onCommentCreated(newComment);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
              parentId={comment.id}
              placeholder={`Reply to ${comment.author?.username || 'this comment'}...`}
            />
          </div>
        )}
      </div>

      {showReplies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onCommentCreated={onCommentCreated}
              onCommentUpdated={onCommentUpdated}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
