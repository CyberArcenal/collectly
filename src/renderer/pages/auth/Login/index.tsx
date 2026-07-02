// src/renderer/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, HandCoins } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { dialogs } from '../../../utils/dialogs';
import Button from '../../../components/UI/Button';
import { version, name } from "../../../../../package.json";



const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect location from protected route
  const from = location.state?.from?.pathname || '/dashboard';

  // Restore remembered email if present
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      
      // Check if 2FA is required
      if ('requires_2fa' in result && result.requires_2fa) {
        // Redirect to 2FA page with checkpoint token
        navigate('/verify-2fa', {
          state: { checkpointToken: result.checkpoint_token, from }
        });
        return;
      }

      // LoginPage successful
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      dialogs.success('LoginPage successful!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'LoginPage failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-color)] p-8">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] rounded-2xl flex items-center justify-center shadow-lg">
              <HandCoins className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mt-4 text-[var(--text-primary)]">Welcome Back</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Enter your email or username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[var(--input-border)] accent-[var(--primary-color)]"
                  disabled={loading}
                />
                <span className="text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[var(--primary-color)] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--primary-color)] hover:underline font-medium">
              Contact your administrator
            </Link>
          </div>

          {/* Version info */}
          <div className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
            {name} {version}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;