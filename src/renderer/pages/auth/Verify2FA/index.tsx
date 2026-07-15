// src/renderer/pages/auth/Verify2FA.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { Shield, Loader2, AlertCircle, RotateCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import authAPI from '../../../api/core/auth';
import tokenStorage from '../../../api/utils/tokenStorage';
import { dialogs } from '../../../utils/dialogs';
import Button from '../../../components/UI/Button';


const Verify2FA: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get checkpoint token from location state (passed from login)
  const checkpointToken = location.state?.checkpointToken;
  const from = location.state?.from || '/dashboard';

  // Redirect if no checkpoint token
  useEffect(() => {
    if (!checkpointToken) {
      navigate('/login', { replace: true });
    }
  }, [checkpointToken, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (value && index === 5) {
      // Small delay to let the last digit render
      setTimeout(() => {
        handleVerify(newCode.join(''));
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: move to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    }

    // Left arrow: move to previous
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Right arrow: move to next
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Enter: submit
    if (e.key === 'Enter') {
      const otpCode = code.join('');
      if (otpCode.length === 6) {
        handleVerify(otpCode);
      } else {
        setError('Please enter all 6 digits');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    // Only accept digits
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Please paste a valid 6-digit code');
      return;
    }
    const digits = pastedData.split('');
    setCode(digits);
    setError(null);
    // Auto-submit after paste
    setTimeout(() => {
      handleVerify(pastedData);
    }, 100);
  };

  const handleVerify = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authAPI.verify2FA(checkpointToken, otpCode);
      if (result.status) {
        // Store tokens
        await tokenStorage.setTokens(
          result.accessToken,
          result.refreshToken,
          result.expiresIn,
          result.user
        );
        setSuccess(true);
        dialogs.success('2FA verified successfully!');
        // Short delay then navigate
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 800);
      } else {
        setError(result.message || 'Invalid verification code. Please try again.');
        // Clear the code for retry
        setCode(['', '', '', '', '', '']);
        // Focus first input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const response = await authAPI.resend2FA(checkpointToken);
      if (response.status) {
        dialogs.success('New verification code sent to your email');
        setTimer(300);
        setCanResend(false);
        // Clear code for new OTP
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-color)] p-8">
          {/* Back button */}
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg
              ${success ? 'bg-green-500/20' : 'bg-[var(--accent-blue-light)]'}`}
            >
              {success ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <Shield className="w-8 h-8 text-[var(--accent-blue)]" />
              )}
            </div>
            <h1 className="text-2xl font-bold mt-4 text-[var(--text-primary)]">
              {success ? 'Verified!' : 'Two-Factor Authentication'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {success
                ? 'Redirecting to dashboard...'
                : 'Enter the 6-digit code sent to your email'}
            </p>
          </div>

          {/* Error Alert */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-500">Verification successful! Redirecting...</p>
            </div>
          )}

          {/* OTP Input */}
          {!success && (
            <>
              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 
                      bg-[var(--input-bg)] text-[var(--text-primary)] 
                      focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent
                      transition-all duration-200
                      ${digit ? 'border-[var(--primary-color)]' : 'border-[var(--input-border)]'}
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={loading}
                    autoFocus={index === 0}
                    aria-label={`Digit ${index + 1} of 6`}
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="text-center space-y-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  Code expires in{' '}
                  <span className={`font-mono font-bold ${timer <= 30 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                    {formatTime(timer)}
                  </span>
                </p>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleResend}
                    disabled={resending || (!canResend && timer > 0)}
                    className={`text-sm flex items-center gap-1 transition-colors
                      ${(!canResend && timer > 0)
                        ? 'text-[var(--text-tertiary)] cursor-not-allowed'
                        : 'text-[var(--primary-color)] hover:underline cursor-pointer'}
                    `}
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4" />
                        Resend code
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Didn't receive the code? Check your spam folder or contact support.
                </p>
              </div>

              {/* Verify Button (for manual submit) */}
              <Button
                variant="primary"
                size="lg"
                disabled={loading || code.join('').length !== 6}
                onClick={() => handleVerify(code.join(''))}
                className="w-full justify-center mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-4">
            <p>Secure 2FA verification • Collectly</p>
            <p className="mt-1">
              <Link to="/help" className="text-[var(--primary-color)] hover:underline">
                Need help?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify2FA;