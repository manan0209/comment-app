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
    <div className="min-h-screen bg-hack-bg">
      <Header />
      
      {/* Main content area that works alongside the header */}
      <div className="flex">
        {/* Left spacer for header sidebar */}
        <div className="w-72 flex-shrink-0" />
        
        {/* Messages section */}
        <div className="flex-1 min-w-0 border-r border-hack-border">
          {/* Message composer */}
          <div className="border-b border-hack-border">
            <CommentForm onCommentCreated={handleCommentCreated} />
          </div>

          {/* Messages feed */}
          <div className="min-h-screen">
            {comments.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-hack-primary to-hack-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                    <span className="text-3xl font-bold text-white">SC</span>
                  </div>
                  <h3 className="text-2xl font-bold text-hack-text mb-3">
                    Welcome to <span className="text-hack-primary">Secret</span>Club #general!
                  </h3>
                  <p className="text-hack-textSecondary mb-6 leading-relaxed">
                    This is the beginning of something awesome. Share your projects, 
                    get help with code, or just chat about whatever you're building! 
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-hack-textSecondary">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-hack-success rounded-full animate-pulse"></div>
                      <span>Safe space for teen builders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-hack-accent rounded-full animate-pulse"></div>
                      <span>Be kind, be curious</span>
                    </div>
                  </div>
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
              <div className="border-t border-hack-border/50 p-6">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMore}
                  className="w-full py-4 text-hack-accent hover:bg-hack-accent/10 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-hack-border hover:border-hack-accent/50"
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner />
                      <span>Loading more messages...</span>
                    </>
                  ) : (
                    <>
                      <span>Load older messages</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 bg-hack-surface/30 overflow-y-auto max-h-screen">
          <div className="p-6 space-y-6">
            {/* Active builders */}
            <div className="bg-hack-surface rounded-xl p-4 border border-hack-border">
              <h3 className="text-lg font-bold text-hack-text mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-hack-success rounded-full animate-pulse"></div>
                <span>Active Builders</span>
              </h3>
              <div className="space-y-3">
                {['alex', 'jordan', 'taylor', 'casey', 'river'].map((name, index) => (
                  <div key={name} className="flex items-center space-x-3 hover:bg-hack-border/30 rounded-lg p-2 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 bg-gradient-to-br from-hack-primary to-hack-secondary rounded-lg flex items-center justify-center`}>
                      <span className="text-hack-text text-sm font-bold">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-hack-text font-medium">{name}</p>
                      <p className="text-sm text-hack-textSecondary">
                        {index === 0 ? 'Building a Discord bot' : 
                         index === 1 ? 'Learning React' :
                         index === 2 ? 'Working on AI project' :
                         index === 3 ? 'Hackathon prep' : 'Just vibing'}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-hack-success rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending projects */}
            <div className="bg-hack-surface rounded-xl p-4 border border-hack-border">
              <h3 className="text-lg font-bold text-hack-text mb-4 flex items-center space-x-2">
                <span className="text-hack-secondary font-bold">HOT</span>
                <span>Trending Projects</span>
              </h3>
              <div className="space-y-3">
                <div className="hover:bg-hack-border/30 rounded-lg p-3 cursor-pointer transition-colors">
                  <h4 className="font-bold text-hack-text">Teen AI Assistant</h4>
                  <p className="text-sm text-hack-textSecondary mb-2">
                    A helpful AI companion for students
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-hack-accent/20 text-hack-accent px-2 py-1 rounded-full">Python</span>
                    <span className="text-xs bg-hack-purple/20 text-hack-purple px-2 py-1 rounded-full">AI</span>
                  </div>
                </div>
                <div className="hover:bg-hack-border/30 rounded-lg p-3 cursor-pointer transition-colors">
                  <h4 className="font-bold text-hack-text">Study Buddy App</h4>
                  <p className="text-sm text-hack-textSecondary mb-2">
                    Connect with study partners nearby
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-hack-green/20 text-hack-green px-2 py-1 rounded-full">React Native</span>
                    <span className="text-xs bg-hack-yellow/20 text-hack-yellow px-2 py-1 rounded-full">Social</span>
                  </div>
                </div>
                <div className="hover:bg-hack-border/30 rounded-lg p-3 cursor-pointer transition-colors">
                  <h4 className="font-bold text-hack-text">Code Mentor</h4>
                  <p className="text-sm text-hack-textSecondary mb-2">
                    Peer-to-peer coding help platform
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-hack-cyan/20 text-hack-cyan px-2 py-1 rounded-full">Next.js</span>
                    <span className="text-xs bg-hack-pink/20 text-hack-pink px-2 py-1 rounded-full">Education</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-hack-surface rounded-xl p-4 border border-hack-border">
              <h3 className="text-lg font-bold text-hack-text mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-hack-border/30 transition-colors text-left">
                  <span className="text-hack-accent">IDEA</span>
                  <span className="text-hack-text">Share an idea</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-hack-border/30 transition-colors text-left">
                  <span className="text-hack-secondary">SHIP</span>
                  <span className="text-hack-text">Ship a project</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-hack-border/30 transition-colors text-left">
                  <span className="text-hack-success">HELP</span>
                  <span className="text-hack-text">Ask for help</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-hack-border/30 transition-colors text-left">
                  <span className="text-hack-purple">TEAM</span>
                  <span className="text-hack-text">Find teammates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
