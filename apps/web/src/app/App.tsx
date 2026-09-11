import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../shared/lib/api'
import { useAuthStore } from '../features/auth/stores/authStore'
import { fetchMe, logoutUser } from '../features/auth/api/authApi'
import { AuthModal } from '../features/auth/components/AuthModal'
import { WorkspaceSwitcher } from '../features/workspaces/components/WorkspaceSwitcher'
import { useWorkspaceStore } from '../features/workspaces/stores/workspaceStore'
import { KanbanBoard } from '../features/boards/components/KanbanBoard'
import { NotificationBell } from '../features/notifications/components/NotificationBell'
import {
  KanbanSquare,
  Database,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
  User,
  LogOut,
  KeyRound,
} from 'lucide-react'

import { ThemeToggle } from '../shared/components/ThemeToggle'
import { useThemeStore } from '../shared/stores/themeStore'

export const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, isAuthenticated, initAuth, clearAuth, setUser } = useAuthStore()
  const { activeWorkspace } = useWorkspaceStore()
  const initTheme = useThemeStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
    initAuth()
    if (isAuthenticated) {
      fetchMe()
        .then((userData) => setUser(userData))
        .catch(() => clearAuth())
    }
  }, [initTheme, initAuth, isAuthenticated, setUser, clearAuth])

  const {
    data: healthData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  })

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // Clear locally even if API fails
    } finally {
      clearAuth()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary transition-colors">
      {/* Studio Ledger Top Navigation Bar */}
      <header className="border-b border-border-subtle bg-surface sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 w-full transition-colors">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-button bg-accent text-white flex items-center justify-center font-bold shadow-sm">
                <KanbanSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-text-primary">FlowBoard</span>
                <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded-chip font-mono bg-accent-subtle text-accent font-semibold tracking-wider">
                  Live
                </span>
              </div>
            </div>

            {/* Workspace Switcher */}
            <WorkspaceSwitcher isAuthenticated={isAuthenticated} />
          </div>

          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-button border border-border-subtle bg-canvas">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.data.database === 'connected' ? 'bg-status-success animate-pulse' : 'bg-priority-medium'
                }`}
              />
              <span className="text-xs font-mono text-text-secondary">
                {isLoading ? 'Checking API...' : isError ? 'API Offline' : `API: ${healthData?.data.database ?? 'Ready'}`}
              </span>
            </div>

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Auth State Button / Profile */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-border-subtle">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-text-primary leading-tight">{user.name}</div>
                  <div className="text-[11px] font-mono text-text-secondary leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-button text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      {isAuthenticated && activeWorkspace ? (
        <KanbanBoard workspace={activeWorkspace} />
      ) : isAuthenticated && !activeWorkspace ? (
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-canvas">
          <div className="w-16 h-16 rounded-card bg-surface border border-border-subtle flex items-center justify-center shadow-card mb-4 text-accent">
            <KanbanSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">No Workspace Selected</h2>
          <p className="text-sm text-text-secondary max-w-md">
            Select a workspace from the header dropdown or create a new workspace to start working with your Kanban boards.
          </p>
        </main>
      ) : (
        /* Unauthenticated Landing & Architecture View */
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-10">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-mono">
            <span>Portfolio Architecture</span>
            <span>/</span>
            <span className="text-text-primary font-semibold">Phase 2: Workspaces & Roles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Workspaces & Role-Based Access Control
          </h1>
          <p className="text-text-secondary max-w-2xl text-base leading-relaxed">
            Multi-workspace tenant separation, unique invitation codes, and reusable role-gated access control
            distinguishing Workspace Admins from Members.
          </p>
        </section>

        {/* Status Diagnostics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Workspace & RBAC Status */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Tenant & RBAC</span>
                <KeyRound className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                {activeWorkspace ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                    <span className="truncate">{activeWorkspace.name}</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-priority-medium" />
                    <span>No Workspace</span>
                  </>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                {activeWorkspace
                  ? `Active role: ${activeWorkspace.role}. ${activeWorkspace.members.length} team member(s) enrolled.`
                  : 'Select or create a workspace using the dropdown above.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>RBAC Guard</span>
              <code className="text-accent font-semibold">WorkspaceRolesGuard</code>
            </div>
          </div>

          {/* Card 2: API Service */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Backend API</span>
                <Server className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                {isLoading ? (
                  <span className="text-text-secondary text-sm">Pinging API...</span>
                ) : isError ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-status-error" />
                    <span>Disconnected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                    <span>NestJS API Active</span>
                  </>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                REST auth controller mounted with DTO validation and error filters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>Endpoint</span>
              <code className="text-accent font-semibold">/api/auth/*</code>
            </div>
          </div>

          {/* Card 3: Database */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">PostgreSQL</span>
                <Database className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
                <span>Prisma Client</span>
              </div>
              <p className="text-xs text-text-secondary">
                User table active with bcrypt password hashing and token hash rotation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>Security</span>
              <span className="text-text-primary font-semibold font-mono text-xs">bcrypt (10 rounds)</span>
            </div>
          </div>

          {/* Card 4: Architecture */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Contracts</span>
                <Layers className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-status-success" />
                <span>Shared Types</span>
              </div>
              <p className="text-xs text-text-secondary">
                Shared DTO interfaces and JWT contracts shared across web and API.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>Type Safety</span>
              <span className="text-text-primary font-semibold font-mono text-xs">Strict Zero-Any</span>
            </div>
          </div>
        </section>

        {/* Studio Ledger Board Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Kanban Workspace Pipeline</h2>
              <p className="text-xs text-text-secondary">
                Cards styled with Studio Ledger design system and 3px priority indicators.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-mono bg-surface border border-border-subtle text-text-secondary">
                <Clock className="w-3.5 h-3.5" /> Next: Phase 2 Workspaces
              </span>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Backlog */}
            <div className="bg-sunken border border-border-subtle rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text-primary">To Do</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-surface border border-border-subtle text-text-secondary font-medium">
                    2
                  </span>
                </div>
              </div>

              {/* Task 1 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-high shadow-card space-y-2 hover:shadow-drag transition-shadow cursor-grab">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>TASK-201</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-high bg-red-50">
                    High
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Workspace Membership & Role-Based Access Control
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Implement Workspace and WorkspaceMember models with Admin vs Member role guards.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Activity className="w-3 h-3 text-accent" /> Phase 2
                  </span>
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                    WS
                  </div>
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-medium shadow-card space-y-2 hover:shadow-drag transition-shadow cursor-grab">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>TASK-202</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-medium bg-amber-50">
                    Medium
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Workspace Switcher & Invitation Flow
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Generate invite codes/links and allow teammates to join existing workspaces.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Activity className="w-3 h-3 text-accent" /> Phase 2
                  </span>
                  <div className="w-6 h-6 rounded-full bg-text-secondary text-white flex items-center justify-center text-[10px] font-bold">
                    INV
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-sunken border border-border-subtle rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text-primary">In Progress</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-surface border border-border-subtle text-text-secondary font-medium">
                    1
                  </span>
                </div>
              </div>

              {/* Task 3 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-accent shadow-card space-y-2 hover:shadow-drag transition-shadow cursor-grab">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>TASK-101</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-accent bg-accent-subtle">
                    Auth
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Team Authentication & Verification
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Dual JWT token lifecycle, refresh token rotation, and Studio Ledger modal UI.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-status-success font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Tested & Verified
                  </span>
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                    JWT
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Done */}
            <div className="bg-sunken border border-border-subtle rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text-primary">Completed</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-surface border border-border-subtle text-text-secondary font-medium">
                    4
                  </span>
                </div>
              </div>

              {/* Completed Task 1 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-low shadow-card space-y-2 opacity-85">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>INIT-001</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-low bg-emerald-50">
                    Done
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug line-through text-text-secondary">
                  Monorepo Scaffolding & Setup
                </h3>
              </div>

              {/* Completed Task 2 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-low shadow-card space-y-2 opacity-85">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>INIT-002</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-low bg-emerald-50">
                    Done
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug line-through text-text-secondary">
                  Docker Compose for Postgres & Redis
                </h3>
              </div>

              {/* Completed Task 3 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-low shadow-card space-y-2 opacity-85">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>AUTH-001</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-low bg-emerald-50">
                    Done
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug line-through text-text-secondary">
                  Passport JWT Strategy & Auth Guards
                </h3>
              </div>

              {/* Completed Task 4 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-low shadow-card space-y-2 opacity-85">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>AUTH-002</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-low bg-emerald-50">
                    Done
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug line-through text-text-secondary">
                  Zustand Auth Store & Auto-Refresh Interceptor
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Collaboration Banner */}
        <section className="bg-surface border border-border-subtle rounded-card p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Real-Time Team Collaboration</h3>
            <p className="text-xs text-text-secondary mt-1">
              Organize workspaces, manage multi-column Kanban boards, and collaborate in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Test Sign In</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-button bg-emerald-50 border border-emerald-200 text-status-success text-xs font-mono font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Session Active: {user?.name}</span>
              </div>
            )}
          </div>
        </section>
      </main>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 px-6 text-center text-xs font-mono text-text-secondary">
        FlowBoard • Team Task Management • Studio Ledger Design System
      </footer>
    </div>
  )
}
export default App
