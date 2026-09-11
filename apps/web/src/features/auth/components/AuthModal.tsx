import React, { useState, useEffect } from 'react'
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { loginUser, registerUser } from '../api/authApi'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        const data = await loginUser({ email, password })
        setAuth(data.user, data.tokens)
        onClose()
      } else {
        if (!name.trim()) {
          setError('Name is required')
          setIsLoading(false)
          return
        }
        const data = await registerUser({ email, password, name })
        setAuth(data.user, data.tokens)
        onClose()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1C1A16]/40 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-border-subtle bg-surface">
          <div>
            <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
              FlowBoard Account
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">
              {mode === 'signin' ? 'Sign in to workspace' : 'Create an account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-border-subtle bg-canvas">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-surface text-text-primary border-b-2 border-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-surface text-text-primary border-b-2 border-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 rounded-button bg-status-error/10 border border-status-error/20 text-status-error text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-text-disabled absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-canvas border border-border-subtle rounded-button text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-disabled absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-canvas border border-border-subtle rounded-button text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-text-secondary">Password</label>
              {mode === 'signin' && (
                <span className="text-[11px] font-mono text-text-secondary">
                  Default test: Password123
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-disabled absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-canvas border border-border-subtle rounded-button text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-text-primary transition-colors focus:outline-none rounded"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-text-secondary leading-normal">
                Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-button bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
