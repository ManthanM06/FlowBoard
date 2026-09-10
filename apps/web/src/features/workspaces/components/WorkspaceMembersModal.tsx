import React, { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  Shield,
  User,
  Trash2,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
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
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [currentDetail, setCurrentDetail] = useState<WorkspaceDetail>(workspace)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const { setActiveWorkspace } = useWorkspaceStore()

  // Always fetch latest workspace detail on open
  useEffect(() => {
    if (!isOpen || !workspace?.id) return
    setCurrentDetail(workspace)
    setIsLoadingDetail(true)

    fetchWorkspaceDetail(workspace.id)
      .then((detail) => {
        setCurrentDetail(detail)
        setActiveWorkspace(detail)
      })
      .catch((err) => {
        console.error('Failed to refresh workspace details:', err)
      })
      .finally(() => {
        setIsLoadingDetail(false)
      })
  }, [isOpen, workspace?.id, setActiveWorkspace])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const active = currentDetail || workspace
  const isAdmin = active.role === WorkspaceRole.ADMIN
  const inviteCode = active.inviteCode || ''

  const handleCopyCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    if (!inviteCode) return
    const inviteUrl = `${window.location.origin}?join=${encodeURIComponent(inviteCode)}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    setActionError(null)
    setBusyUserId(userId)
    try {
      await updateMemberRole(active.id, userId, { role: newRole })
      const refreshed = await fetchWorkspaceDetail(active.id)
      setCurrentDetail(refreshed)
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
      await removeMember(active.id, userId)
      const refreshed = await fetchWorkspaceDetail(active.id)
      setCurrentDetail(refreshed)
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1A16]/30 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Dialog Card (stop propagation so clicking inside doesn't close) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
                Workspace Members
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-accent-subtle text-accent font-semibold">
                {active.role}
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">{active.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite Code Box */}
        <div className="p-6 pb-4 border-b border-border-subtle bg-canvas/40 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-text-secondary">
              Workspace Invite Code
            </label>
            {isLoadingDetail && (
              <span className="text-[11px] text-text-secondary flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>

          {inviteCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 bg-surface border border-accent/30 rounded-button text-text-primary font-mono text-sm font-semibold select-all tracking-wide text-accent">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2.5 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                  title="Copy code to clipboard"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-text-secondary">
                  Share this code with teammates to join via the workspace switcher.
                </p>
                <button
                  onClick={handleCopyLink}
                  className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1 shrink-0"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-button bg-amber-50 border border-amber-200 text-priority-medium text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Generating invite code...</span>
            </div>
          )}
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
              Enrolled Members ({active.members.length})
            </span>
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle rounded-button bg-surface overflow-hidden">
            {active.members.map((member) => {
              const isOwner = member.userId === active.ownerId
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
        <div className="p-4 border-t border-border-subtle bg-canvas/30 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-text-secondary">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px]">Esc</kbd> or click outside to close
          </span>
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
