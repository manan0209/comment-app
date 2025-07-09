'use client';

import { Comment, api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Header } from './Header';
import { LoadingSpinner } from './LoadingSpinner';

export const CommentApp = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async (pageNum = 1) => {
    try {
      const response = await api.get(`/comments?page=${pageNum}&limit=20`);
      const data = response.data;
      
      if (pageNum === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreComments = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await fetchComments(page + 1);
  };

  const handleCommentCreated = (newComment: Comment) => {
    if (newComment.parentId) {
      setComments(prev =>
        prev.map(comment =>
          addReplyToComment(comment, newComment.parentId!, newComment)
        )
      );
    } else {
      setComments(prev => [newComment, ...prev]);
    }
  };

  const addReplyToComment = (
    comment: Comment,
    parentId: string,
    newReply: Comment
  ): Comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [newReply, ...comment.replies],
      };
    }

    return {
      ...comment,
      replies: comment.replies.map(reply =>
        addReplyToComment(reply, parentId, newReply)
      ),
    };
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev =>
      prev.map(comment =>
        updateCommentInTree(comment, updatedComment)
      )
    );
  };

  const updateCommentInTree = (
    comment: Comment,
    updatedComment: Comment
  ): Comment => {
    if (comment.id === updatedComment.id) {
      return updatedComment;
    }

    return {
      ...comment,
      replies: comment.replies.map(reply =>
        updateCommentInTree(reply, updatedComment)
      ),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-text mb-2">
            Welcome, {user?.username}!
          </h1>
          <p className="text-dark-textSecondary">
            Share your thoughts and join the conversation.
          </p>
        </div>

        <div className="mb-8">
          <CommentForm onCommentCreated={handleCommentCreated} />
        </div>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-textSecondary">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onCommentCreated={handleCommentCreated}
                onCommentUpdated={handleCommentUpdated}
              />
            ))
          )}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreComments}
              disabled={loadingMore}
              className="px-6 py-2 bg-dark-surface border border-dark-border rounded-md text-dark-text hover:bg-dark-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              {loadingMore ? <LoadingSpinner /> : 'Load More Comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
