'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
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

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      
      // Decode the JWT token from Google
      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      
      // Extract username from email (before @ symbol)
      const username = decoded.email.split('@')[0];
      
      // Try to register first (in case it's a new user)
      try {
        await register(username, decoded.email, `google_${decoded.sub}`);
        toast.success('🎉 Welcome to Hack Club!');
      } catch (registerError: any) {
        // If user already exists, try to login
        if (registerError.response?.status === 409) {
          await login(decoded.email, `google_${decoded.sub}`);
          toast.success('🚀 Welcome back to Hack Club!');
        } else {
          throw registerError;
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hack-bg via-hack-surface to-hack-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-hack-primary to-hack-secondary rounded-2xl mb-6 shadow-lg animate-bounce-in">
            <span className="text-3xl font-bold text-white">HC</span>
          </div>
          <h1 className="text-4xl font-bold text-hack-text mb-2">
            <span className="text-hack-primary">Hack</span>Club
          </h1>
          <p className="text-hack-textSecondary text-lg">
            Where amazing things get built
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
                  <span className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <span className="text-lg">🚀</span>
                  </span>
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

              {/* Google Sign-In */}
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  shape="rectangular"
                  width="100%"
                  text="signin_with"
                />
              </div>
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
                  <span className="flex items-center space-x-2">
                    <span>Join Hack Club</span>
                    <span className="text-lg">✨</span>
                  </span>
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

              {/* Google Sign-In */}
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  shape="rectangular"
                  width="100%"
                  text="signup_with"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-hack-textSecondary">
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>🌟</span>
              <span>Projects</span>
            </a>
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>🎯</span>
              <span>Hackathons</span>
            </a>
            <a href="#" className="hover:text-hack-primary transition-colors flex items-center space-x-1">
              <span>🤝</span>
              <span>Community</span>
            </a>
          </div>
          <p className="text-sm text-hack-textSecondary">
            Made with ❤️ by the Hack Club community
          </p>
        </div>
      </div>
    </div>
  );
};
