'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { 
  BellIcon, 
  UserCircleIcon, 
  HomeIcon, 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChatBubbleLeftEllipsisIcon,
  FireIcon,
  SparklesIcon,
  CodeBracketIcon,
  CommandLineIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftEllipsisIcon as ChatBubbleLeftEllipsisIconSolid,
  FireIcon as FireIconSolid,
  SparklesIcon as SparklesIconSolid,
  CodeBracketIcon as CodeBracketIconSolid,
  CommandLineIcon as CommandLineIconSolid,
  LightBulbIcon as LightBulbIconSolid,
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
    { id: 'projects', label: 'Projects', icon: CodeBracketIcon, activeIcon: CodeBracketIconSolid },
    { id: 'hackathons', label: 'Hackathons', icon: FireIcon, activeIcon: FireIconSolid },
    { id: 'ideas', label: 'Ideas', icon: LightBulbIcon, activeIcon: LightBulbIconSolid },
    { id: 'terminal', label: 'Terminal', icon: CommandLineIcon, activeIcon: CommandLineIconSolid },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, activeIcon: BellIconSolid },
  ];

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

  return (
    <header className="bg-hack-bg border-b border-hack-border fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-hack-bg/90">
      <div className="flex">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0 px-6 py-6 border-r border-hack-border bg-hack-surface/30 fixed left-0 top-0 h-screen overflow-y-auto z-40">
          <div className="flex flex-col space-y-2 h-full">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-hack-primary to-hack-secondary rounded-xl flex items-center justify-center shadow-hack animate-pulse-slow">
                  <span className="text-2xl font-bold text-white">SC</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-hack-text font-mono">
                    Secret<span className="text-hack-primary">Club</span>
                  </h1>
                  <p className="text-sm text-hack-textSecondary font-mono">of teens</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">
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
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left group ${
                      isActive 
                        ? 'bg-gradient-to-r from-hack-primary/20 to-hack-secondary/20 text-hack-text border border-hack-primary/30 shadow-hack' 
                        : 'text-hack-textSecondary hover:bg-hack-surface hover:text-hack-text'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`h-6 w-6 ${isActive ? 'text-hack-primary' : 'text-hack-textSecondary group-hover:text-hack-text'} transition-colors`} />
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-hack-primary text-hack-text text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-medium ${isActive ? 'text-hack-text font-bold' : 'text-hack-textSecondary group-hover:text-hack-text'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto">
                        <SparklesIcon className="h-4 w-4 text-hack-secondary animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="pt-4 border-t border-hack-border">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-3 w-full rounded-xl hover:bg-hack-surface transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${getUserGradient(user?.username || '')} rounded-xl flex items-center justify-center shadow-hack group-hover:shadow-hack-lg transition-all duration-200`}>
                    <span className="text-hack-text text-lg font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-hack-text">{user?.username}</p>
                    <p className="text-sm text-hack-textSecondary font-mono">@{user?.username?.toLowerCase()}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Cog6ToothIcon className="h-5 w-5 text-hack-textSecondary" />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-hack-surface border border-hack-border rounded-xl shadow-hack-lg py-2 animate-slide-up">
                    <button
                      onClick={() => {
                        // TODO: Add settings page
                        setShowUserMenu(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-hack-text hover:bg-hack-border/50 transition-colors"
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-hack-accent" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-hack-border my-2" />
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-hack-text hover:bg-hack-border/50 transition-colors"
                    >
                      <span>Log out @{user?.username?.toLowerCase()}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Channel header */}
        <div className="flex-1 border-b border-hack-border bg-hack-surface/50 fixed top-0 left-72 right-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-hack-text">#general</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-hack-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-hack-textSecondary font-mono">
                    {Math.floor(Math.random() * 100) + 50} teens online
                  </span>
                  <span className="text-hack-textSecondary">•</span>
                  <span className="text-sm text-hack-accent font-mono">SOM'25 Secret Club</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg hover:bg-hack-surface transition-colors">
                  <Cog6ToothIcon className="h-5 w-5 text-hack-textSecondary hover:text-hack-text" />
                </button>
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
