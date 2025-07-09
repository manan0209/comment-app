'use client';

import { api, Comment, CreateCommentData } from '@/lib/api';
import { useState } from 'react';
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
  placeholder = "What's on your mind?",
}: CommentFormProps) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const commentData: CreateCommentData = {
        content: data.content,
        ...(parentId && { parentId }),
      };

      const response = await api.post('/comments', commentData);
      onCommentCreated(response.data);
      reset();
      
      if (onCancel) {
        onCancel();
      }
      
      toast.success('Comment posted successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to post comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <textarea
          {...register('content', {
            required: 'Comment cannot be empty',
            minLength: { value: 1, message: 'Comment cannot be empty' },
            maxLength: { value: 2000, message: 'Comment cannot exceed 2000 characters' },
          })}
          placeholder={placeholder}
          rows={parentId ? 3 : 4}
          className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent resize-none"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-dark-error">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-dark-textSecondary">
          Comments can be edited for 15 minutes after posting
        </div>
        
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-dark-textSecondary hover:text-dark-text transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-dark-accent hover:bg-dark-accentHover text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <LoadingSpinner />}
            <span>{parentId ? 'Reply' : 'Post Comment'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
