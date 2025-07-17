'use client';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface AdminComment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

interface AdminStats {
  totalUsers: number;
  totalComments: number;
  deletedComments: number;
  activeComments: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchComments();
      fetchStats();
    }
  }, [user]);

  const fetchComments = async () => {
    try {
      const response = await api.get('/admin/comments');
      setComments(response.data.comments);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const searchComments = async () => {
    if (!searchTerm.trim()) {
      fetchComments();
      return;
    }

    try {
      const response = await api.get(`/admin/search?term=${encodeURIComponent(searchTerm)}`);
      setComments(response.data);
    } catch (error: any) {
      toast.error('Search failed');
    }
  };

  const performAction = async (commentId: string, action: string, reason?: string) => {
    try {
      await api.post(`/admin/comments/${commentId}/action`, {
        action,
        reason,
      });
      
      toast.success(`Comment ${action === 'soft_delete' ? 'removed' : action}d successfully`);
      fetchComments();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const performBulkAction = async (action: string) => {
    if (selectedComments.length === 0) {
      toast.error('Please select comments first');
      return;
    }

    try {
      await api.post('/admin/comments/bulk-action', {
        commentIds: selectedComments,
        action,
        reason: 'Bulk admin action',
      });
      
      toast.success(`Bulk ${action} completed`);
      setSelectedComments([]);
      fetchComments();
      fetchStats();
    } catch (error: any) {
      toast.error('Bulk action failed');
    }
  };

  const toggleCommentSelection = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">Admin Panel</h1>
          <p className="text-dark-textSecondary">Manage comments and users</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h3 className="text-dark-textSecondary text-sm">Total Users</h3>
              <p className="text-2xl font-bold text-dark-text">{stats.totalUsers}</p>
            </div>
            <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h3 className="text-dark-textSecondary text-sm">Total Comments</h3>
              <p className="text-2xl font-bold text-dark-text">{stats.totalComments}</p>
            </div>
            <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h3 className="text-dark-textSecondary text-sm">Active Comments</h3>
              <p className="text-2xl font-bold text-dark-success">{stats.activeComments}</p>
            </div>
            <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h3 className="text-dark-textSecondary text-sm">Deleted Comments</h3>
              <p className="text-2xl font-bold text-dark-error">{stats.deletedComments}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent"
            />
            <button
              onClick={searchComments}
              className="px-6 py-2 bg-dark-accent hover:bg-dark-accentHover text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedComments.length > 0 && (
          <div className="mb-6 p-4 bg-dark-surface border border-dark-border rounded-lg">
            <p className="text-dark-text mb-3">
              {selectedComments.length} comment(s) selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => performBulkAction('soft_delete')}
                className="px-4 py-2 bg-dark-error hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Remove Selected
              </button>
              <button
                onClick={() => performBulkAction('restore')}
                className="px-4 py-2 bg-dark-success hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Restore Selected
              </button>
              <button
                onClick={() => setSelectedComments([])}
                className="px-4 py-2 bg-dark-border hover:bg-gray-600 text-dark-text rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 bg-dark-surface border border-dark-border rounded-lg ${
                comment.isDeleted ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment.id)}
                    onChange={() => toggleCommentSelection(comment.id)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-dark-text font-medium">
                      {comment.author.username} ({comment.author.email})
                    </p>
                    <p className="text-dark-textSecondary text-sm">
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.isDeleted && comment.deletedAt && (
                        <span className="text-dark-error ml-2">
                          • Deleted {new Date(comment.deletedAt).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!comment.isDeleted ? (
                    <button
                      onClick={() => performAction(comment.id, 'soft_delete', 'Abusive content')}
                      className="px-3 py-1 bg-dark-error hover:bg-red-600 text-white text-sm rounded transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => performAction(comment.id, 'restore')}
                      className="px-3 py-1 bg-dark-success hover:bg-green-600 text-white text-sm rounded transition-colors"
                    >
                      Restore
                    </button>
                  )}
                  <button
                    onClick={() => performAction(comment.id, 'hard_delete')}
                    className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white text-sm rounded transition-colors"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
              
              <div className="p-3 bg-dark-bg rounded border border-dark-border">
                <p className="text-dark-text whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-textSecondary">No comments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
