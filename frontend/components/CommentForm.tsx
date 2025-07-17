'use client';

import { api, Comment, CreateCommentData } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  PhotoIcon, 
  FaceSmileIcon, 
  GifIcon, 
  CodeBracketIcon,
  CommandLineIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
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
  placeholder = "What are you building? 🔥",
}: CommentFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>();

  const maxLength = 500; // Generous limit for hack club 
  const content = watch('content') || '';
  
  // Update character count
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

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

  const onSubmit = async (data: FormData) => {
    if (data.content.trim().length === 0) {
      toast.error('Message cannot be empty');
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
      
      toast.success('🚀 Shipped!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to post message';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getCharCountColor = () => {
    if (charCount > maxLength) return 'text-hack-error';
    if (charCount > maxLength * 0.8) return 'text-hack-warning';
    return 'text-hack-textSecondary';
  };

  const isOverLimit = charCount > maxLength;

  return (
    <div className={`${parentId ? 'bg-hack-surface/50' : 'bg-hack-surface'} ${parentId ? 'border border-hack-border rounded-xl m-4' : ''} p-6`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-br ${getUserGradient(user?.username || '')} rounded-xl flex items-center justify-center shadow-hack`}>
              <span className="text-hack-text text-lg font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'H'}
              </span>
            </div>
          </div>

          {/* Input area */}
          <div className="flex-1">
            <textarea
              {...register('content', {
                required: 'Message cannot be empty',
                maxLength: { value: maxLength, message: `Message cannot exceed ${maxLength} characters` },
              })}
              placeholder={placeholder}
              rows={parentId ? 3 : 4}
              className="w-full px-0 py-3 bg-transparent border-none text-hack-text placeholder-hack-textSecondary focus:outline-none resize-none text-lg font-sans"
              style={{ fontSize: parentId ? '16px' : '18px' }}
            />
            
            {errors.content && (
              <p className="text-sm text-hack-error mt-2 font-mono">{errors.content.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between ml-16">
          {/* Media buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 text-hack-accent hover:bg-hack-accent/10 rounded-lg transition-all duration-200 hover:scale-110"
              title="Add photo"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-hack-secondary hover:bg-hack-secondary/10 rounded-lg transition-all duration-200 hover:scale-110"
              title="Add code"
            >
              <CodeBracketIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-hack-purple hover:bg-hack-purple/10 rounded-lg transition-all duration-200 hover:scale-110"
              title="Add GIF"
            >
              <GifIcon className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 text-hack-green hover:bg-hack-green/10 rounded-lg transition-all duration-200 hover:scale-110"
              title="Add emoji"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="p-2 text-hack-cyan hover:bg-hack-cyan/10 rounded-lg transition-all duration-200 hover:scale-110"
              title="Terminal command"
            >
              <CommandLineIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Character count and submit */}
          <div className="flex items-center space-x-4">
            {/* Character count */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-mono ${getCharCountColor()}`}>
                {charCount}/{maxLength}
              </span>
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-hack-border"
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
              </div>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-hack-textSecondary hover:text-hack-text transition-colors font-mono"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || isOverLimit || charCount === 0}
              className="px-6 py-2 bg-gradient-to-r from-hack-primary to-hack-secondary hover:from-hack-primaryHover hover:to-hack-secondary text-hack-text font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-hack hover:shadow-hack-lg transform hover:scale-105"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <RocketLaunchIcon className="h-4 w-4" />
                  <span>{parentId ? 'Reply' : 'Ship it!'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
