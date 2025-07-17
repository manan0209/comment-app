'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingSpinner } from './LoadingSpinner';

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

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-dark-text mb-2">ThreadsX</h1>
          <p className="text-dark-textSecondary text-lg">
            Join the conversation
          </p>
        </div>

        <div className="bg-dark-surface p-8 rounded-2xl border border-dark-border">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-l-full border transition-colors ${
                isLogin
                  ? 'bg-dark-text text-dark-bg border-dark-text'
                  : 'bg-transparent text-dark-text border-dark-border hover:bg-dark-border'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-r-full border transition-colors ${
                !isLogin
                  ? 'bg-dark-text text-dark-bg border-dark-text'
                  : 'bg-transparent text-dark-text border-dark-border hover:bg-dark-border'
              }`}
            >
              Sign up
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...loginForm.register('email', { required: 'Email is required' })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Enter your email"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-dark-error">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...loginForm.register('password', { required: 'Password is required' })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Enter your password"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-dark-error">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-dark-accent hover:bg-dark-accentHover text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <LoadingSpinner /> : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
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
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Choose a username"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-dark-error">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...registerForm.register('email', { required: 'Email is required' })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Enter your email"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-dark-error">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Create a password"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-dark-error">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...registerForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                  })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent focus:border-transparent"
                  placeholder="Confirm your password"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-dark-error">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-dark-accent hover:bg-dark-accentHover text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <LoadingSpinner /> : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
