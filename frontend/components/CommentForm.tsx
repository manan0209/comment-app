'use client';

import { api, Comment, CreateCommentData } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PhotoIcon, FaceSmileIcon, GifIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LoadingSpinner } from './LoadingSpinner';

interface CommentFormProps {
  onCommentCreated: (comment: Comment) => void;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

interface FormData {
  content: string;
}

export const CommentForm = ({
  onCommentCreated,
  parentId,
  onCancel,
  placeholder = "What's happening?",
}: CommentFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>();

  const maxLength = 280; // Twitter-like character limit
  const content = watch('content') || '';
  
  // Update character count
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  const onSubmit = async (data: FormData) => {
    if (data.content.trim().length === 0) {
      toast.error('Comment cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const commentData: CreateCommentData = {
        content: data.content,
        ...(parentId && { parentId }),
      };

      const response = await api.post('/comments', commentData);
      onCommentCreated(response.data);
      reset();
      setCharCount(0);
      
      if (onCancel) {
        onCancel();
      }
      
      toast.success('Posted!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to post comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getCharCountColor = () => {
    if (charCount > maxLength) return 'text-red-500';
    if (charCount > maxLength * 0.8) return 'text-yellow-500';
    return 'text-dark-textSecondary';
  };

  const isOverLimit = charCount > maxLength;

  return (
    <div className={`${parentId ? 'bg-dark-bg' : 'bg-dark-surface'} ${parentId ? 'border border-dark-border rounded-lg' : ''} p-4`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* Input area */}
          <div className="flex-1">
            <textarea
              {...register('content', {
                required: 'Comment cannot be empty',
                maxLength: { value: maxLength, message: `Comment cannot exceed ${maxLength} characters` },
              })}
              placeholder={placeholder}
              rows={parentId ? 2 : 3}
              className="w-full px-0 py-2 bg-transparent border-none text-dark-text placeholder-dark-textSecondary focus:outline-none resize-none text-xl"
              style={{ fontSize: parentId ? '16px' : '20px' }}
            />
            
            {errors.content && (
              <p className="text-sm text-red-400 mt-1">{errors.content.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between ml-13">
          {/* Media buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
              title="Add photo"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
              title="Add GIF"
            >
              <GifIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
              title="Add emoji"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Character count and submit */}
          <div className="flex items-center space-x-3">
            {/* Character count circle */}
            <div className="relative">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-dark-border"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - charCount / maxLength)}`}
                  className={getCharCountColor()}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-medium ${getCharCountColor()}`}>
                  {charCount > maxLength * 0.8 ? maxLength - charCount : ''}
                </span>
              </div>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || isOverLimit || charCount === 0}
              className="px-6 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <LoadingSpinner />}
              <span>{parentId ? 'Reply' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
