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
      
      <div className="max-w-6xl mx-auto flex">
        {/* Left spacer (matches header sidebar) */}
        <div className="w-64" />
        
        {/* Main content */}
        <div className="flex-1 border-l border-r border-dark-border min-h-screen">
          {/* Tweet composer */}
          <div className="border-b border-dark-border">
            <CommentForm onCommentCreated={handleCommentCreated} />
          </div>

          {/* Feed */}
          <div>
            {comments.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-xs mx-auto">
                  <h3 className="text-2xl font-bold text-dark-text mb-2">Welcome to ThreadsX!</h3>
                  <p className="text-dark-textSecondary mb-4">
                    This is where you'll see posts from people you follow and trending topics.
                  </p>
                  <p className="text-dark-textSecondary">
                    Start by posting your first thought above! 👆
                  </p>
                </div>
              </div>
            ) : (
              <>
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onCommentCreated={handleCommentCreated}
                    onCommentUpdated={handleCommentUpdated}
                  />
                ))}
              </>
            )}

            {hasMore && (
              <div className="border-t border-dark-border p-4">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMore}
                  className="w-full py-3 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner />
                      <span>Loading more posts...</span>
                    </>
                  ) : (
                    <span>Show more posts</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 p-4">
          <div className="sticky top-20 space-y-4">
            {/* Search */}
            <div className="bg-dark-surface rounded-2xl p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ThreadsX"
                  className="w-full bg-dark-bg border border-dark-border rounded-2xl pl-10 pr-4 py-3 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-3.5">
                  <svg className="h-5 w-5 text-dark-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Trending */}
            <div className="bg-dark-surface rounded-2xl p-4">
              <h3 className="text-xl font-bold text-dark-text mb-4">What's happening</h3>
              <div className="space-y-3">
                <div className="hover:bg-dark-border rounded-lg p-2 cursor-pointer transition-colors">
                  <p className="text-sm text-dark-textSecondary">Trending in Technology</p>
                  <p className="font-bold text-dark-text">React 19</p>
                  <p className="text-sm text-dark-textSecondary">42.5K posts</p>
                </div>
                <div className="hover:bg-dark-border rounded-lg p-2 cursor-pointer transition-colors">
                  <p className="text-sm text-dark-textSecondary">Trending</p>
                  <p className="font-bold text-dark-text">Next.js</p>
                  <p className="text-sm text-dark-textSecondary">28.1K posts</p>
                </div>
                <div className="hover:bg-dark-border rounded-lg p-2 cursor-pointer transition-colors">
                  <p className="text-sm text-dark-textSecondary">Trending in Programming</p>
                  <p className="font-bold text-dark-text">TypeScript</p>
                  <p className="text-sm text-dark-textSecondary">18.7K posts</p>
                </div>
              </div>
            </div>

            {/* Who to follow */}
            <div className="bg-dark-surface rounded-2xl p-4">
              <h3 className="text-xl font-bold text-dark-text mb-4">Who to follow</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">V</span>
                    </div>
                    <div>
                      <p className="font-bold text-dark-text">Vercel</p>
                      <p className="text-sm text-dark-textSecondary">@vercel</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-dark-text text-dark-bg font-bold rounded-full hover:bg-gray-200 transition-colors">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <div>
                      <p className="font-bold text-dark-text">Netlify</p>
                      <p className="text-sm text-dark-textSecondary">@netlify</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-dark-text text-dark-bg font-bold rounded-full hover:bg-gray-200 transition-colors">
                    Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
