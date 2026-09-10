import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../shared/lib/api'
import {
  KanbanSquare,
  Database,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export const App: React.FC = () => {
  const { data: healthData, isLoading, isError } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchHealth,
    refetchInterval: 5000,
  })

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary selection:bg-accent-subtle selection:text-accent">
      {/* Top Navigation */}
      <header className="border-b border-border-subtle bg-surface/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-button bg-accent text-white flex items-center justify-center font-bold shadow-sm">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-text-primary">FlowBoard</span>
              <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded-chip font-mono bg-accent-subtle text-accent font-semibold tracking-wider">
                Phase 0 Setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-button border border-border-subtle bg-canvas">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.data.database === 'connected' ? 'bg-status-success animate-pulse' : 'bg-priority-medium'
                }`}
              />
              <span className="text-xs font-mono text-text-secondary">
                {isLoading ? 'Checking system...' : isError ? 'API Offline' : `API: ${healthData?.data.database ?? 'Ready'}`}
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors text-xs font-mono"
            >
              v0.1.0-alpha
            </a>
          </div>
        </div>
      </header>

      {/* Hero & Workspace Banner */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-10">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-mono">
            <span>Portfolio Architecture</span>
            <span>/</span>
            <span className="text-text-primary font-semibold">Phase 0: Monorepo Foundation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Collaborative Real-time Kanban Workspace
          </h1>
          <p className="text-text-secondary max-w-2xl text-base leading-relaxed">
            Studio Ledger design system initialized with NestJS backend, PostgreSQL schema,
            Redis pub/sub, React Query state orchestration, and strict TypeScript types.
          </p>
        </section>

        {/* System Diagnostics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: API Server */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Backend Service</span>
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
                REST API running on port 3001 with global validation and typed exception filters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>Endpoint</span>
              <code className="text-accent font-semibold">GET /api/health</code>
            </div>
          </div>

          {/* Card 2: PostgreSQL & Prisma */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Data Persistence</span>
                <Database className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
                <span>Postgres & Prisma</span>
              </div>
              <p className="text-xs text-text-secondary">
                Relational schema configured for Users, Workspaces, Boards, Columns, Tasks, and Comments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>Container</span>
              <code className="text-accent font-semibold">flowboard_postgres:5432</code>
            </div>
          </div>

          {/* Card 3: Monorepo Architecture */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-card hover:border-accent transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-text-secondary tracking-wider">Monorepo Setup</span>
                <Layers className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-status-success" />
                <span>NPM Workspaces</span>
              </div>
              <p className="text-xs text-text-secondary">
                Modular contract sharing via <code className="text-accent">@flowboard/shared-types</code> between web & api.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
              <span>TypeScript</span>
              <span className="text-text-primary font-semibold">Strict (Zero Any)</span>
            </div>
          </div>
        </section>

        {/* Studio Ledger Board Preview (Demonstrating Theme & Typography) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Studio Ledger Theme Preview</h2>
              <p className="text-xs text-text-secondary">
                Demonstrating warm palette, tactile elevation, and 3px priority indicators.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-mono bg-surface border border-border-subtle text-text-secondary">
                <Clock className="w-3.5 h-3.5" /> Next: Phase 1 Auth
              </span>
            </div>
          </div>

          {/* Mock Board Columns */}
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
                  <span>TASK-101</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-high bg-red-50">
                    High
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Implement JWT Auth & Passport strategy
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Dual token access + refresh flow with bcrypt password hashing and auth guards.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Activity className="w-3 h-3 text-accent" /> Phase 1
                  </span>
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                    FB
                  </div>
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-surface rounded-card p-4 border border-border-subtle border-l-[3px] border-l-priority-medium shadow-card space-y-2 hover:shadow-drag transition-shadow cursor-grab">
                <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                  <span>TASK-102</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-medium bg-amber-50">
                    Medium
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Setup Workspace invite and role guards
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Admin vs Member role enforcement across workspace mutations.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Activity className="w-3 h-3 text-accent" /> Phase 2
                  </span>
                  <div className="w-6 h-6 rounded-full bg-text-secondary text-white flex items-center justify-center text-[10px] font-bold">
                    AG
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
                  <span>TASK-001</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-accent bg-accent-subtle">
                    Setup
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug">
                  Monorepo Scaffolding & Verification
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Bootstrapping Docker containers, database schemas, and shared contracts.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-status-success font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> In Progress
                  </span>
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                    YOU
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
                    3
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
                  Git Repository & Ignore Rules
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
                  <span>INIT-003</span>
                  <span className="px-1.5 py-0.5 rounded-chip text-[11px] font-semibold text-priority-low bg-emerald-50">
                    Done
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary leading-snug line-through text-text-secondary">
                  Prisma Database Model Architecture
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Phase Roadmap Progression Footer */}
        <section className="bg-surface border border-border-subtle rounded-card p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Phase 0 Checklist Complete</h3>
            <p className="text-xs text-text-secondary mt-1">
              Ready to execute Phase 1: Authentication & User Management (JWT, bcrypt, Passport).
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-sm">
            <span>Proceed to Phase 1</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 px-6 text-center text-xs font-mono text-text-secondary">
        FlowBoard • Built according to architecture.md and design.md standards
      </footer>
    </div>
  )
}
export default App
