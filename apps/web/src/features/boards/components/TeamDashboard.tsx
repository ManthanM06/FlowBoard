import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
} from 'lucide-react'
import {
  BoardDetail,
  TaskPriority,
  WorkspaceMemberSummary,
  TaskSummary,
} from '@flowboard/shared-types'

interface TeamDashboardProps {
  board: BoardDetail
  workspaceMembers?: WorkspaceMemberSummary[]
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({
  board,
  workspaceMembers = [],
}) => {
  // Aggregate all tasks across columns
  const allTasks: TaskSummary[] = []
  board.columns.forEach((col) => {
    if (col.tasks) {
      allTasks.push(...col.tasks)
    }
  })

  const totalTasks = allTasks.length

  // Completed column (last column or column with 'done' in name)
  const doneColumn =
    board.columns.find((c) => c.name.toLowerCase().includes('done')) ||
    (board.columns.length > 0 ? board.columns[board.columns.length - 1] : null)

  const completedTasks = doneColumn
    ? (doneColumn.tasks || []).length
    : 0

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // High priority count
  const highPriorityTasks = allTasks.filter(
    (t) => t.priority === TaskPriority.HIGH
  ).length

  // Overdue tasks count
  const now = new Date()
  const overdueTasks = allTasks.filter((t) => {
    if (!t.dueDate) return false
    try {
      const d = new Date(t.dueDate)
      return d.getTime() < now.getTime() - 24 * 60 * 60 * 1000
    } catch {
      return false
    }
  }).length

  // Priority breakdown
  const mediumTasks = allTasks.filter(
    (t) => t.priority === TaskPriority.MEDIUM
  ).length
  const lowTasks = allTasks.filter(
    (t) => t.priority === TaskPriority.LOW
  ).length

  const highPct = totalTasks > 0 ? Math.round((highPriorityTasks / totalTasks) * 100) : 0
  const medPct = totalTasks > 0 ? Math.round((mediumTasks / totalTasks) * 100) : 0
  const lowPct = totalTasks > 0 ? Math.round((lowTasks / totalTasks) * 100) : 0

  // Member workload breakdown
  const memberStats = workspaceMembers.map((member) => {
    const assignedTasks = allTasks.filter((t) =>
      t.assignees?.some((a) => a.id === member.userId)
    )
    const memberHigh = assignedTasks.filter(
      (t) => t.priority === TaskPriority.HIGH
    ).length
    const memberOverdue = assignedTasks.filter((t) => {
      if (!t.dueDate) return false
      try {
        const d = new Date(t.dueDate)
        return d.getTime() < now.getTime() - 24 * 60 * 60 * 1000
      } catch {
        return false
      }
    }).length

    return {
      member,
      total: assignedTasks.length,
      high: memberHigh,
      overdue: memberOverdue,
    }
  })

  // Unassigned tasks
  const unassignedCount = allTasks.filter(
    (t) => !t.assignees || t.assignees.length === 0
  ).length

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            {board.name} — Metrics & Analytics
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time delivery KPIs, workload distribution, and column velocity
          </p>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-surface rounded-card p-4 border border-border-subtle shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-button bg-accent/10 text-accent flex items-center justify-center font-bold">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {totalTasks}
            </div>
            <div className="text-xs text-text-secondary font-medium">Total Tasks</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-surface rounded-card p-4 border border-border-subtle shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-button bg-emerald-50 text-priority-low border border-emerald-200 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {completionRate}%
            </div>
            <div className="text-xs text-text-secondary font-medium">
              {completedTasks} of {totalTasks} Completed
            </div>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-surface rounded-card p-4 border border-border-subtle shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-button bg-red-50 text-priority-high border border-red-200 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {highPriorityTasks}
            </div>
            <div className="text-xs text-text-secondary font-medium">
              High Priority Tasks
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-surface rounded-card p-4 border border-border-subtle shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-button bg-amber-50 text-priority-medium border border-amber-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {overdueTasks}
            </div>
            <div className="text-xs text-text-secondary font-medium">
              Overdue Tasks
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="bg-surface rounded-card p-5 border border-border-subtle shadow-card space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span>Overall Board Delivery Progress</span>
          </span>
          <span className="font-bold font-mono text-accent">{completionRate}%</span>
        </div>
        <div className="w-full h-3 bg-canvas rounded-full overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Two Column Grid: Priority Breakdown & Column Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-surface rounded-card p-5 border border-border-subtle shadow-card space-y-4">
          <h3 className="text-xs font-bold text-text-primary font-mono uppercase tracking-wider">
            Priority Distribution
          </h3>

          <div className="space-y-3 text-xs">
            {/* High */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-priority-high font-semibold">High Priority</span>
                <span className="text-text-secondary">
                  {highPriorityTasks} ({highPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-priority-high rounded-full"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-priority-medium font-semibold">Medium Priority</span>
                <span className="text-text-secondary">
                  {mediumTasks} ({medPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-priority-medium rounded-full"
                  style={{ width: `${medPct}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-priority-low font-semibold">Low Priority</span>
                <span className="text-text-secondary">
                  {lowTasks} ({lowPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-priority-low rounded-full"
                  style={{ width: `${lowPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column Status Breakdown */}
        <div className="bg-surface rounded-card p-5 border border-border-subtle shadow-card space-y-4">
          <h3 className="text-xs font-bold text-text-primary font-mono uppercase tracking-wider">
            Column Status Breakdown
          </h3>

          <div className="space-y-2.5">
            {board.columns.map((col) => {
              const count = (col.tasks || []).length
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
              return (
                <div key={col.id} className="text-xs space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="font-semibold text-text-primary">{col.name}</span>
                    <span className="text-text-secondary">
                      {count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/70 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Member Workload Breakdown Table */}
      <div className="bg-surface rounded-card p-5 border border-border-subtle shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-primary font-mono uppercase tracking-wider">
            Team Workload Distribution ({workspaceMembers.length} Members)
          </h3>
          {unassignedCount > 0 && (
            <span className="text-[11px] font-mono text-priority-medium">
              {unassignedCount} unassigned tasks
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-mono uppercase text-text-secondary">
                <th className="py-2.5 px-3">Team Member</th>
                <th className="py-2.5 px-3">Assigned Tasks</th>
                <th className="py-2.5 px-3">High Priority</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3">Workload Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {memberStats.map(({ member, total, high, overdue }) => {
                const sharePct =
                  totalTasks > 0 ? Math.round((total / totalTasks) * 100) : 0
                return (
                  <tr key={member.userId} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-3 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-mono text-[9px] font-bold">
                        {(member.user.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">
                          {member.user.name}
                        </div>
                        <div className="text-[10px] font-mono text-text-secondary">
                          {member.user.email}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-text-primary">
                      {total}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {high > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-semibold bg-red-50 text-priority-high border border-red-200">
                          {high}
                        </span>
                      ) : (
                        <span className="text-text-secondary/50">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {overdue > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-semibold bg-amber-50 text-priority-medium border border-amber-200">
                          {overdue}
                        </span>
                      ) : (
                        <span className="text-text-secondary/50">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-canvas rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {sharePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
