import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronDown,
  Plus,
  Users,
  Briefcase,
  Check,
  Key,
} from 'lucide-react'
import { useWorkspaceStore, getStoredActiveWorkspaceId } from '../stores/workspaceStore'
import { fetchWorkspaces, fetchWorkspaceDetail } from '../api/workspaceApi'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { JoinWorkspaceModal } from './JoinWorkspaceModal'
import { WorkspaceMembersModal } from './WorkspaceMembersModal'
import { WorkspaceRole } from '@flowboard/shared-types'

interface WorkspaceSwitcherProps {
  isAuthenticated: boolean
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    workspaces,
    activeWorkspace,
    setWorkspaces,
    setActiveWorkspace,
  } = useWorkspaceStore()

  // Load workspaces when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const loadWorkspaces = async () => {
      try {
        const list = await fetchWorkspaces()
        setWorkspaces(list)

        const storedId = getStoredActiveWorkspaceId()
        const target = list.find((w) => w.id === storedId) || list[0]

        if (target) {
          const detail = await fetchWorkspaceDetail(target.id)
          setActiveWorkspace(detail)
        } else {
          setActiveWorkspace(null)
        }
      } catch (err) {
        console.error('Failed to load workspaces', err)
      }
    }

    loadWorkspaces()
  }, [isAuthenticated, setWorkspaces, setActiveWorkspace])

  // Check URL query parameters for invite link
  useEffect(() => {
    if (!isAuthenticated) return
    const params = new URLSearchParams(window.location.search)
    const joinCode = params.get('join')
    if (joinCode) {
      setIsJoinOpen(true)
    }
  }, [isAuthenticated])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelect = async (workspaceId: string) => {
    setIsOpen(false)
    try {
      const detail = await fetchWorkspaceDetail(workspaceId)
      setActiveWorkspace(detail)
    } catch (err) {
      console.error('Failed to switch workspace', err)
    }
  }

  if (!isAuthenticated) return null

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-button border border-border-subtle bg-surface hover:bg-canvas transition-all text-xs font-medium shadow-sm"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Briefcase className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold text-text-primary max-w-[120px] sm:max-w-[180px] truncate">
            {activeWorkspace?.name || 'No Workspace'}
          </span>
          {activeWorkspace && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-chip uppercase font-semibold ${
                activeWorkspace.role === WorkspaceRole.ADMIN
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-canvas text-text-secondary border border-border-subtle'
              }`}
            >
              {activeWorkspace.role}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-64 bg-surface border border-border-subtle rounded-card shadow-modal p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[11px] font-mono uppercase text-text-secondary font-semibold">
              Workspaces
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {workspaces.map((ws) => {
                const isSelected = activeWorkspace?.id === ws.id
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelect(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-button text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-accent-subtle text-accent font-semibold'
                        : 'text-text-primary hover:bg-canvas'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase text-text-secondary">
                        {ws.role}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                  </button>
                )
              })}

              {workspaces.length === 0 && (
                <div className="px-3 py-2 text-xs text-text-secondary text-center">
                  No workspaces found
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-border-subtle" />

            {/* Actions */}
            {activeWorkspace && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMembersOpen(true)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-button text-xs text-text-primary hover:bg-canvas transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-text-secondary" />
                <span>Members & Invite Code</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false)
                setIsCreateOpen(true)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-button text-xs text-text-primary hover:bg-canvas transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span>Create Workspace</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                setIsJoinOpen(true)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-button text-xs text-text-primary hover:bg-canvas transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-text-secondary" />
              <span>Join with Invite Code</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <JoinWorkspaceModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />

      {activeWorkspace && (
        <WorkspaceMembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          workspace={activeWorkspace}
        />
      )}
    </>
  )
}
