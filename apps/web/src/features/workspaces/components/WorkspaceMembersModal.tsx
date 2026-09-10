import React, { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Shield,
  User,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { WorkspaceDetail, WorkspaceRole } from '@flowboard/shared-types'
import {
  updateMemberRole,
  removeMember,
  fetchWorkspaceDetail,
} from '../api/workspaceApi'
import { useWorkspaceStore } from '../stores/workspaceStore'

interface WorkspaceMembersModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: WorkspaceDetail
}

export const WorkspaceMembersModal: React.FC<WorkspaceMembersModalProps> = ({
  isOpen,
  onClose,
  workspace,
}) => {
  const [copied, setCopied] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const { setActiveWorkspace } = useWorkspaceStore()
  const isAdmin = workspace.role === WorkspaceRole.ADMIN

  if (!isOpen) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(workspace.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    setActionError(null)
    setBusyUserId(userId)
    try {
      await updateMemberRole(workspace.id, userId, { role: newRole })
      const refreshed = await fetchWorkspaceDetail(workspace.id)
      setActiveWorkspace(refreshed)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message)
      } else {
        setActionError('Failed to change member role')
      }
    } finally {
      setBusyUserId(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return
    }

    setActionError(null)
    setBusyUserId(userId)
    try {
      await removeMember(workspace.id, userId)
      const refreshed = await fetchWorkspaceDetail(workspace.id)
      setActiveWorkspace(refreshed)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message)
      } else {
        setActionError('Failed to remove member')
      }
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
                Workspace Members
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-accent-subtle text-accent font-semibold">
                {workspace.role}
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">{workspace.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite Code Box */}
        <div className="p-6 pb-2 border-b border-border-subtle bg-canvas/50 shrink-0">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Workspace Invite Code
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-xs font-mono bg-surface border border-border-subtle rounded-button text-text-primary select-all">
              {workspace.inviteCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-button bg-surface border border-border-subtle text-xs font-medium text-text-primary hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-success" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-text-secondary mt-1.5">
            Teammates can enter this invite code in the workspace switcher to join with Member access.
          </p>
        </div>

        {/* Members Roster */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {actionError && (
            <div className="p-3 rounded-button bg-red-50 border border-red-200 text-status-error text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase font-mono tracking-wider">
              Members ({workspace.members.length})
            </span>
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle rounded-button bg-surface overflow-hidden">
            {workspace.members.map((member) => {
              const isOwner = member.userId === workspace.ownerId
              const isBusy = busyUserId === member.userId

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-canvas/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {member.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {member.user.name}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-chip bg-amber-50 text-priority-medium border border-amber-200">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-text-secondary truncate">
                        {member.user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && !isOwner ? (
                      <div className="flex items-center gap-2">
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                        ) : (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.userId, e.target.value as WorkspaceRole)
                              }
                              className="text-xs font-mono bg-canvas border border-border-subtle rounded-button px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                            >
                              <option value={WorkspaceRole.MEMBER}>Member</option>
                              <option value={WorkspaceRole.ADMIN}>Admin</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              title="Remove Member"
                              className="p-1 rounded-button text-text-secondary hover:text-status-error hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-chip text-xs font-mono bg-canvas border border-border-subtle text-text-secondary">
                        {member.role === WorkspaceRole.ADMIN ? (
                          <Shield className="w-3 h-3 text-accent" />
                        ) : (
                          <User className="w-3 h-3 text-text-secondary" />
                        )}
                        <span>{member.role}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-canvas/30 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-button bg-surface border border-border-subtle text-xs font-medium text-text-primary hover:bg-canvas transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
