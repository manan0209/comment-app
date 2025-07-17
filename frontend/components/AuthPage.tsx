'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);
    try {
      await register(data.username, data.email, data.password);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSlackAuth = () => {
    // Redirect to Slack OAuth
    const slackClientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/slack/callback`);
    const scope = encodeURIComponent('identity.basic identity.email identity.avatar');
    
    window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scope}&redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hack-bg via-hack-surface to-hack-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-hack-primary to-hack-secondary rounded-2xl mb-6 shadow-lg animate-bounce-in">
            <span className="text-3xl font-bold text-white">SC</span>
          </div>
          <h1 className="text-4xl font-bold text-hack-text mb-2">
            <span className="text-hack-primary">Secret</span>Club
          </h1>
          <p className="text-hack-textSecondary text-lg">
            Where amazing teens build together
          </p>
        </div>

        <div className="bg-hack-surface p-8 rounded-2xl border border-hack-border shadow-2xl backdrop-blur-sm">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-l-full border transition-all duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-hack-primary to-hack-secondary text-white border-hack-primary shadow-lg'
                  : 'bg-transparent text-hack-text border-hack-border hover:bg-hack-border/30'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-r-full border transition-all duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-hack-primary to-hack-secondary text-white border-hack-primary shadow-lg'
                  : 'bg-transparent text-hack-text border-hack-border hover:bg-hack-border/30'
              }`}
            >
              Sign up
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...loginForm.register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-hack-error">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...loginForm.register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-hack-error">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-hack-primary to-hack-secondary text-white font-bold rounded-xl hover:from-hack-primary/90 hover:to-hack-secondary/90 focus:outline-none focus:ring-2 focus:ring-hack-primary focus:ring-offset-2 focus:ring-offset-hack-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hack-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-hack-surface px-4 text-hack-textSecondary">or continue with</span>
                </div>
              </div>

              {/* Slack Sign-In */}
              <button
                type="button"
                onClick={handleSlackAuth}
                disabled={loading}
                className="w-full py-3 px-6 bg-slack-purple hover:bg-slack-purple/90 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slack-purple focus:ring-offset-2 focus:ring-offset-hack-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.52v2.522a2.528 2.528 0 0 1-2.52 2.523z"/>
                  <path d="M6.313 15.165a2.528 2.528 0 0 1 2.521-2.523 2.528 2.528 0 0 1 2.521 2.523v6.333A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.502v-6.333z"/>
                  <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"/>
                  <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
                  <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522 2.521 2.528 2.528 0 0 1-2.522 2.521h-2.521V8.834h2.521z"/>
                  <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
                  <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521z"/>
                  <path d="M15.165 17.688a2.528 2.528 0 0 1-2.521-2.523 2.528 2.528 0 0 1 2.521-2.521h6.333A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.502 2.523h-6.333z"/>
                </svg>
                <span>Sign in with Slack</span>
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Username
                </label>
                <input
                  type="text"
                  {...registerForm.register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores',
                    },
                  })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Choose a username"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-hack-error">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...registerForm.register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-hack-error">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Create a password"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-hack-error">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-hack-text mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                  })}
                  className="w-full px-4 py-3 bg-hack-bg border border-hack-border rounded-xl text-hack-text placeholder-hack-textSecondary focus:outline-none focus:ring-2 focus:ring-hack-primary focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-hack-error">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-hack-primary to-hack-secondary text-white font-bold rounded-xl hover:from-hack-primary/90 hover:to-hack-secondary/90 focus:outline-none focus:ring-2 focus:ring-hack-primary focus:ring-offset-2 focus:ring-offset-hack-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <span>Join Secret Club</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hack-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-hack-surface px-4 text-hack-textSecondary">or continue with</span>
                </div>
              </div>

              {/* Slack Sign-In */}
              <button
                type="button"
                onClick={handleSlackAuth}
                disabled={loading}
                className="w-full py-3 px-6 bg-slack-purple hover:bg-slack-purple/90 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slack-purple focus:ring-offset-2 focus:ring-offset-hack-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.52v2.522a2.528 2.528 0 0 1-2.52 2.523z"/>
                  <path d="M6.313 15.165a2.528 2.528 0 0 1 2.521-2.523 2.528 2.528 0 0 1 2.521 2.523v6.333A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.502v-6.333z"/>
                  <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"/>
                  <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
                  <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522 2.521 2.528 2.528 0 0 1-2.522 2.521h-2.521V8.834h2.521z"/>
                  <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
                  <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521z"/>
                  <path d="M15.165 17.688a2.528 2.528 0 0 1-2.521-2.523 2.528 2.528 0 0 1 2.521-2.521h6.333A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.502 2.523h-6.333z"/>
                </svg>
                <span>Sign up with Slack</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-hack-textSecondary">
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>Projects</span>
            </a>
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>Hackathons</span>
            </a>
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>Community</span>
            </a>
          </div>
          <p className="text-sm text-hack-textSecondary">
            Made with love by the Secret Club community
          </p>
        </div>
      </div>
    </div>
  );
};
