'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight,
  Sparkles, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { firebaseAuth, clearError } from '@/store/slices/authSlice';
import { resetPassword } from '@/lib/firebaseAuth';
import ParticleBackground from './ParticleBackground';
import BrandLogo from '@/components/ui/BrandLogo';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

const springTransition = { type: 'spring' as const, stiffness: 280, damping: 28 };

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    setMounted(true);
    sessionStorage.removeItem('auth-redirecting');
  }, []);

  const goDashboard = () => {
    if (localStorage.getItem('offlineMode') === 'true') {
      toast.success('Signed in (offline mode — start backend for full sync)');
    } else {
      toast.success(`Welcome to ${BRAND.fullName}!`);
    }
    sessionStorage.setItem('showWelcome', '1');
    router.push('/welcome');
  };

  const handleSocial = async (provider: 'google' | 'github') => {
    dispatch(clearError());
    try {
      await dispatch(firebaseAuth(provider)).unwrap();
      goDashboard();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Sign in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      if (isSignUp) {
        await dispatch(firebaseAuth({
          type: 'email',
          email: form.email,
          password: form.password,
          isSignUp: true,
          displayName: `${form.firstName} ${form.lastName}`.trim(),
        })).unwrap();
      } else {
        await dispatch(firebaseAuth({
          type: 'email',
          email: form.email,
          password: form.password,
          isSignUp: false,
        })).unwrap();
      }
      goDashboard();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Authentication failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.error('Enter your email first');
      return;
    }
    try {
      await resetPassword(form.email);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Could not send reset email');
    }
  };

  const toggleMode = () => {
    dispatch(clearError());
    setIsSignUp(!isSignUp);
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="auth-shell relative min-h-screen flex items-center justify-center overflow-hidden bg-[#07070d] p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ParticleBackground />

      {mounted && (
        <motion.div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(244,114,182,0.35), transparent)',
            left: mousePos.x - 250,
            top: mousePos.y - 250,
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 20 }}
        />
      )}

      <motion.div className="relative w-full max-w-[1100px]">
        <motion.div
          className="relative flex min-h-[min(640px,90vh)] rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-black/50"
          layout
          transition={springTransition}
        >
          {/* Brand panel */}
          <motion.div
            className="absolute top-0 bottom-0 w-full md:w-1/2 z-10 hidden md:flex flex-col justify-between p-10 lg:p-12 overflow-hidden"
            animate={{ x: isSignUp ? '100%' : '0%' }}
            transition={springTransition}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                background: isSignUp
                  ? 'linear-gradient(145deg, #120a1a 0%, #3b1f4a 45%, #9a3412 100%)'
                  : 'linear-gradient(145deg, #120a1a 0%, #4a1942 45%, #be185d 100%)',
              }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            <motion.div className="absolute inset-0 bg-black/40" />

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'login'}
                className="relative z-10"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45 }}
              >
                <BrandLogo size="lg" showText className="mb-6" textClassName="[&_p:first-child]:text-white [&_p:last-child]:text-slate-300" />
                <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line drop-shadow-sm">
                  {isSignUp ? 'Join AROWWAI\nFashion Store' : 'Style Meets\nSmart Retail'}
                </h2>
                <p className="text-slate-200 text-base max-w-sm leading-relaxed">
                  {isSignUp
                    ? 'Create your account and manage your Mawanella fashion store with AI-powered POS.'
                    : `Premium fashion POS for ${BRAND.location}. Inventory, billing, analytics — all in one cloud platform.`}
                </p>
                <div className="flex items-center gap-2 mt-6 text-slate-300 text-sm">
                  <MapPin className="w-4 h-4 text-rose-300 shrink-0" />
                  Mawanella, Sri Lanka
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div className="relative z-10 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {['POS', 'Firebase Cloud', 'AI Analytics'].map((tag, i) => (
                <motion.span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/30 text-slate-100 border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Form side */}
          <motion.div
            className={cn(
              'relative z-20 flex w-full md:w-1/2 bg-[#12121a] border-l border-white/10',
              isSignUp ? 'md:mr-auto' : 'md:ml-auto'
            )}
          >
            <div className="flex flex-col justify-center w-full p-8 md:p-10 lg:p-12 overflow-y-auto max-h-[min(640px,90vh)]">
              {/* Mobile brand */}
              <motion.div className="md:hidden flex justify-center mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BrandLogo size="md" showText className="justify-center" textClassName="[&_p:first-child]:text-white [&_p:last-child]:text-slate-400" />
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'form-signup' : 'form-login'}
                  initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                  transition={{ duration: 0.35 }}
                >
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-slate-300 text-sm mb-6">
                    {isSignUp ? 'Sign up with email or social accounts' : 'Sign in to your fashion store dashboard'}
                  </p>

                  {/* Social auth */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button
                      type="button"
                      onClick={() => handleSocial('google')}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(255,255,255,0.15)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <GoogleIcon /> Google
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => handleSocial('github')}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#242436] text-white font-semibold text-sm border border-white/20 hover:bg-[#2e2e44] transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(139,92,246,0.2)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <GithubIcon /> GitHub
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">or email</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                      <motion.div className="grid grid-cols-2 gap-3" custom={0} variants={inputVariants} initial="hidden" animate="visible">
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-rose-400 transition-colors" />
                          <input type="text" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#1e1e2a] border border-white/20 text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 transition-all" required={isSignUp} />
                        </div>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-rose-400 transition-colors" />
                          <input type="text" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#1e1e2a] border border-white/20 text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 transition-all" required={isSignUp} />
                        </div>
                      </motion.div>
                    )}

                    <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible" className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-rose-400 transition-colors" />
                      <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#1e1e2a] border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 transition-all" required />
                    </motion.div>

                    {isSignUp && (
                      <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible" className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-rose-400 transition-colors" />
                        <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#1e1e2a] border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 transition-all" />
                      </motion.div>
                    )}

                    <motion.div custom={3} variants={inputVariants} initial="hidden" animate="visible" className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-rose-400 transition-colors" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#1e1e2a] border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 transition-all" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </motion.div>

                    {!isSignUp && (
                      <motion.div custom={4} variants={inputVariants} initial="hidden" animate="visible" className="flex justify-end">
                        <button type="button" onClick={handleForgotPassword} className="text-xs text-rose-300 hover:text-rose-200 font-medium transition-colors">
                          Forgot password?
                        </button>
                      </motion.div>
                    )}

                    <motion.div custom={5} variants={inputVariants} initial="hidden" animate="visible">
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 via-fuchsia-600 to-violet-600 hover:from-rose-400 hover:via-fuchsia-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-900/40"
                        whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(244,114,182,0.35)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        ) : (
                          <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>
                        )}
                      </motion.button>
                    </motion.div>
                  </form>

                  <motion.p className="mt-6 text-center text-sm text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button onClick={toggleMode} className="text-rose-300 hover:text-rose-200 font-semibold transition-colors">
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              <motion.div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-[11px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Sparkles className="w-3 h-3 text-slate-400" />
                Secured by Firebase · {BRAND.copyright}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
