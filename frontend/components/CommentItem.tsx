'use client';

import { api, Comment, UpdateCommentData } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
    ArrowUturnLeftIcon,
    ChatBubbleLeftIcon,
    PencilIcon,
    TrashIcon,
    HeartIcon,
    ArrowPathRoundedSquareIcon,
    ShareIcon,
    EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
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
  const [liked, setLiked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
    
    // Twitter-like time format
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = now.diff(createdAt, 'hours');
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = now.diff(createdAt, 'days');
    if (diffDays < 7) return `${diffDays}d`;
    
    return createdAt.format('MMM D');
  };

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Implement actual like functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    toast.success('Link copied to clipboard!');
  };

  const marginLeft = level > 0 ? 3 : 0;

  return (
    <div 
      className="animate-fade-in"
      style={{ marginLeft: `${marginLeft}rem` }}
    >
      <div className={`border-b border-dark-border hover:bg-dark-surface/50 transition-colors ${
        comment.isDeleted ? 'opacity-60' : ''
      } ${level === 0 ? 'px-4 py-3' : 'px-3 py-2'}`}>
        
        {/* Main tweet content */}
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {comment.author?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex items-center space-x-1">
                <h3 className="font-bold text-dark-text text-sm hover:underline cursor-pointer">
                  {comment.author?.username || 'Unknown User'}
                </h3>
                <span className="text-dark-textSecondary text-sm">
                  @{comment.author?.username?.toLowerCase() || 'unknown'}
                </span>
                <span className="text-dark-textSecondary text-sm">·</span>
                <time className="text-dark-textSecondary text-sm hover:underline cursor-pointer">
                  {renderTimeInfo()}
                </time>
                {comment.isEdited && (
                  <>
                    <span className="text-dark-textSecondary text-sm">·</span>
                    <span className="text-dark-textSecondary text-sm">edited</span>
                  </>
                )}
              </div>
              
              {/* Dropdown menu */}
              <div className="ml-auto relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-full hover:bg-dark-border text-dark-textSecondary hover:text-dark-text transition-colors"
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-lg z-50 py-1">
                    {canEdit && !isEditing && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-border transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowDropdown(false);
                        }}
                        disabled={loading}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-dark-border transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                    
                    {canRestore && (
                      <button
                        onClick={() => {
                          handleRestore();
                          setShowDropdown(false);
                        }}
                        disabled={loading}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-green-400 hover:bg-dark-border transition-colors disabled:opacity-50"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleShare();
                        setShowDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-border transition-colors"
                    >
                      <ShareIcon className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="mb-3">
              {isEditing ? (
                <form onSubmit={handleSubmit(handleEdit)} className="space-y-3">
                  <textarea
                    {...register('content', {
                      required: 'Comment cannot be empty',
                      minLength: { value: 1, message: 'Comment cannot be empty' },
                      maxLength: { value: 2000, message: 'Comment cannot exceed 2000 characters' },
                    })}
                    rows={3}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {errors.content && (
                    <p className="text-sm text-red-400">{errors.content.message}</p>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                      className="px-4 py-1.5 text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
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
                    <p className="text-dark-text whitespace-pre-wrap text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {!comment.isDeleted && !isEditing && (
              <div className="flex items-center justify-between max-w-md mt-2">
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="group flex items-center space-x-2 text-dark-textSecondary hover:text-blue-400 transition-colors"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                  </div>
                  {comment.replies.length > 0 && (
                    <span className="text-sm">{comment.replies.length}</span>
                  )}
                </button>

                <button
                  onClick={handleLike}
                  className="group flex items-center space-x-2 text-dark-textSecondary hover:text-red-400 transition-colors"
                >
                  <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                    {liked ? (
                      <HeartIconSolid className="h-4 w-4 text-red-400" />
                    ) : (
                      <HeartIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm">0</span>
                </button>

                <button
                  onClick={handleShare}
                  className="group flex items-center space-x-2 text-dark-textSecondary hover:text-green-400 transition-colors"
                >
                  <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                    <ArrowPathRoundedSquareIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">0</span>
                </button>

                <button
                  onClick={handleShare}
                  className="group flex items-center space-x-2 text-dark-textSecondary hover:text-blue-400 transition-colors"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                    <ShareIcon className="h-4 w-4" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && !comment.isDeleted && (
          <div className="mt-3 ml-13">
            <CommentForm
              onCommentCreated={(newComment) => {
                onCommentCreated(newComment);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
              parentId={comment.id}
              placeholder={`Reply to @${comment.author?.username || 'user'}...`}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="border-l-2 border-dark-border ml-6">
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

      {/* Dropdown overlay */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
