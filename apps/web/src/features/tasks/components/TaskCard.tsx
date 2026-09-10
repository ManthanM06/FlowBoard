import React from 'react'
import { Calendar, User } from 'lucide-react'
import { TaskSummary, TaskPriority } from '@flowboard/shared-types'

interface TaskCardProps {
  task: TaskSummary
  onClick: () => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const getPriorityBorderClass = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'border-l-priority-high'
      case TaskPriority.MEDIUM:
        return 'border-l-priority-medium'
      case TaskPriority.LOW:
        return 'border-l-priority-low'
      default:
        return 'border-l-border-subtle'
    }
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return (
          <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-mono font-semibold bg-red-50 text-priority-high border border-red-200">
            High
          </span>
        )
      case TaskPriority.MEDIUM:
        return (
          <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-mono font-semibold bg-amber-50 text-priority-medium border border-amber-200">
            Medium
          </span>
        )
      case TaskPriority.LOW:
        return (
          <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-mono font-semibold bg-emerald-50 text-priority-low border border-emerald-200">
            Low
          </span>
        )
    }
  }

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const isOverdue = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      return d.getTime() < now.getTime() - 24 * 60 * 60 * 1000
    } catch {
      return false
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
    <div
      onClick={onClick}
      className={`bg-surface rounded-card p-3.5 border border-border-subtle border-l-[3px] ${getPriorityBorderClass(
        task.priority
      )} shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 cursor-pointer space-y-2.5 group`}
    >
      {/* Top row: Priority badge */}
      <div className="flex items-center justify-between">
        {getPriorityBadge(task.priority)}
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-text-primary leading-snug break-words group-hover:text-accent transition-colors">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Due Date & Assignees */}
      <div className="flex items-center justify-between pt-1 text-xs text-text-secondary">
        {task.dueDate ? (
          <div
            className={`flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded ${
              isOverdue(task.dueDate)
                ? 'bg-red-50 text-priority-high font-semibold border border-red-200'
                : 'text-text-secondary'
            }`}
            title={task.dueDate}
          >
            <Calendar className="w-3 h-3" />
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Assignee Avatar Stack */}
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-mono text-[9px] font-bold ring-2 ring-surface shadow-xs"
                title={a.name}
              >
                {getInitials(a.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-surface border border-border-subtle text-text-secondary flex items-center justify-center font-mono text-[9px] font-semibold ring-2 ring-surface">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-border-subtle/80 flex items-center justify-center text-text-secondary/40">
            <User className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  )
}
