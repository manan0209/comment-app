'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { 
  BellIcon, 
  UserCircleIcon, 
  HomeIcon, 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftEllipsisIcon as ChatBubbleLeftEllipsisIconSolid
} from '@heroicons/react/24/solid';
import { useState } from 'react';
import { NotificationPanel } from './NotificationPanel';

export const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, activeIcon: HomeIconSolid },
    { id: 'explore', label: 'Explore', icon: MagnifyingGlassIcon, activeIcon: MagnifyingGlassIcon },
    { id: 'messages', label: 'Messages', icon: ChatBubbleLeftEllipsisIcon, activeIcon: ChatBubbleLeftEllipsisIconSolid },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, activeIcon: BellIconSolid },
  ];

  return (
    <header className="bg-dark-bg border-b border-dark-border sticky top-0 z-50 backdrop-blur-md bg-dark-bg/80">
      <div className="max-w-6xl mx-auto">
        <div className="flex">
          {/* Left sidebar */}
          <div className="w-64 px-4 py-4">
            <div className="flex flex-col space-y-2">
              {/* Logo */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-text">ThreadsX</h1>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = activeTab === item.id ? item.activeIcon : item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id === 'notifications') {
                          setShowNotifications(!showNotifications);
                        }
                      }}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-full transition-colors w-full text-left hover:bg-dark-surface ${
                        isActive ? 'font-bold' : 'font-normal'
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`h-6 w-6 ${isActive ? 'text-dark-text' : 'text-dark-textSecondary'}`} />
                        {item.id === 'notifications' && unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={`text-xl ${isActive ? 'text-dark-text' : 'text-dark-textSecondary'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* User menu */}
              <div className="mt-auto pt-4">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-3 w-full rounded-full hover:bg-dark-surface transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-dark-text">{user?.username}</p>
                      <p className="text-sm text-dark-textSecondary">@{user?.username?.toLowerCase()}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-dark-surface border border-dark-border rounded-2xl shadow-lg py-3">
                      <button
                        onClick={() => {
                          // TODO: Add settings page
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-dark-text hover:bg-dark-border transition-colors"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        <span>Settings</span>
                      </button>
                      <div className="border-t border-dark-border my-2" />
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-dark-text hover:bg-dark-border transition-colors"
                      >
                        <span>Log out @{user?.username?.toLowerCase()}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main content area header */}
          <div className="flex-1 border-l border-r border-dark-border">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-text">Home</h2>
                <Cog6ToothIcon className="h-5 w-5 text-dark-textSecondary hover:text-dark-text cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification panel */}
      {showNotifications && (
        <NotificationPanel 
          onClose={() => setShowNotifications(false)} 
        />
      )}

      {/* Overlays */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};
