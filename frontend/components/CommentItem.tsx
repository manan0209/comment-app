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
    FireIcon,
    CodeBracketIcon,
    RocketLaunchIcon,
    SparklesIcon,
    CommandLineIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, FireIcon as FireIconSolid } from '@heroicons/react/24/solid';
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
  const [fired, setFired] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    defaultValues: { content: comment.content }
  });

  const hackClubGradients = [
    'from-hack-primary to-hack-secondary',
    'from-hack-accent to-hack-purple',
    'from-hack-cyan to-hack-green',
    'from-hack-yellow to-hack-orange',
    'from-hack-pink to-hack-purple',
  ];

  const getUserGradient = (username: string) => {
    const index = username ? username.length % hackClubGradients.length : 0;
    return hackClubGradients[index];
  };

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

  const handleFire = () => {
    setFired(!fired);
    // TODO: Implement actual fire reaction functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    toast.success('Link copied to clipboard!');
  };

  const marginLeft = level > 0 ? 4 : 0;

  return (
    <div 
      className="animate-fade-in group hover:bg-hack-surface/30 transition-all duration-200"
      style={{ marginLeft: `${marginLeft}rem` }}
    >
      <div className={`px-6 py-4 ${level === 0 ? 'border-b border-hack-border/50' : ''} ${
        comment.isDeleted ? 'opacity-60' : ''
      }`}>
        
        {/* Main message content */}
        <div className="flex space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 bg-gradient-to-br ${getUserGradient(comment.author?.username || '')} rounded-xl flex items-center justify-center shadow-hack transition-all duration-200 hover:shadow-hack-lg`}>
              <span className="text-hack-text text-sm font-bold">
                {comment.author?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-bold text-hack-text hover:text-hack-primary cursor-pointer transition-colors">
                {comment.author?.username || 'Unknown User'}
              </h3>
              <time className="text-sm text-hack-textSecondary font-mono">
                {renderTimeInfo()}
              </time>
              {comment.isEdited && (
                <span className="text-xs text-hack-textSecondary bg-hack-border/50 px-2 py-1 rounded-full font-mono">
                  edited
                </span>
              )}
              
              {/* Dropdown menu */}
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-lg hover:bg-hack-border text-hack-textSecondary hover:text-hack-text transition-colors"
                >
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-hack-surface border border-hack-border rounded-xl shadow-hack-lg z-50 py-2 animate-slide-up">
                    {canEdit && !isEditing && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-hack-text hover:bg-hack-border/50 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 text-hack-accent" />
                        <span>Edit message</span>
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowDropdown(false);
                        }}
                        disabled={loading}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-hack-error hover:bg-hack-border/50 transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete message</span>
                      </button>
                    )}
                    
                    {canRestore && (
                      <button
                        onClick={() => {
                          handleRestore();
                          setShowDropdown(false);
                        }}
                        disabled={loading}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-hack-success hover:bg-hack-border/50 transition-colors disabled:opacity-50"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                        <span>Restore message</span>
                      </button>
                    )}
                    
                    <div className="border-t border-hack-border my-2" />
                    
                    <button
                      onClick={() => {
                        handleShare();
                        setShowDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-hack-text hover:bg-hack-border/50 transition-colors"
                    >
                      <ShareIcon className="h-4 w-4 text-hack-cyan" />
                      <span>Copy link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Message content */}
            <div className="mb-3">
              {isEditing ? (
                <form onSubmit={handleSubmit(handleEdit)} className="space-y-3">
                  <textarea
                    {...register('content', {
                      required: 'Message cannot be empty',
                      minLength: { value: 1, message: 'Message cannot be empty' },
                      maxLength: { value: 500, message: 'Message cannot exceed 500 characters' },
                    })}
                    rows={3}
                    className="w-full px-3 py-2 bg-hack-bg border border-hack-border rounded-lg text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent resize-none"
                  />
                  {errors.content && (
                    <p className="text-sm text-hack-error font-mono">{errors.content.message}</p>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-hack-primary hover:bg-hack-primaryHover text-hack-text font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                      className="px-4 py-2 text-sm text-hack-textSecondary hover:text-hack-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {comment.isDeleted ? (
                    <p className="text-hack-textSecondary italic bg-hack-border/20 px-3 py-2 rounded-lg">
                      This message has been deleted
                      {canRestore && (
                        <span className="ml-2 text-hack-success">
                          • You can restore it within 15 minutes
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="text-hack-text whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reactions and actions */}
            {!comment.isDeleted && !isEditing && (
              <div className="flex items-center space-x-1 mt-2">
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="group flex items-center space-x-1 px-3 py-1 rounded-lg text-hack-textSecondary hover:text-hack-accent hover:bg-hack-accent/10 transition-all duration-200"
                >
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {comment.replies.length > 0 ? comment.replies.length : 'Reply'}
                  </span>
                </button>

                <button
                  onClick={handleLike}
                  className="group flex items-center space-x-1 px-3 py-1 rounded-lg text-hack-textSecondary hover:text-hack-pink hover:bg-hack-pink/10 transition-all duration-200"
                >
                  {liked ? (
                    <HeartIconSolid className="h-4 w-4 text-hack-pink" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {liked ? '1' : ''}
                  </span>
                </button>

                <button
                  onClick={handleFire}
                  className="group flex items-center space-x-1 px-3 py-1 rounded-lg text-hack-textSecondary hover:text-hack-secondary hover:bg-hack-secondary/10 transition-all duration-200"
                >
                  {fired ? (
                    <FireIconSolid className="h-4 w-4 text-hack-secondary" />
                  ) : (
                    <FireIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {fired ? '1' : ''}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="group flex items-center space-x-1 px-3 py-1 rounded-lg text-hack-textSecondary hover:text-hack-cyan hover:bg-hack-cyan/10 transition-all duration-200"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && !comment.isDeleted && (
          <div className="mt-4">
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
        <div className="relative">
          {/* Thread line */}
          <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-hack-border/30"></div>
          
          {comment.replies.map((reply, index) => (
            <div key={reply.id} className="relative">
              <CommentItem
                comment={reply}
                onCommentCreated={onCommentCreated}
                onCommentUpdated={onCommentUpdated}
                level={level + 1}
              />
            </div>
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
