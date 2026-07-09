import React from 'react'
import { Pin, X } from 'lucide-react'

export function SocialChatHeader({
  activeConv,
  otherUser,
  isTyping,
  pinnedMessage,
  onUnpin,
}) {
  if (!activeConv) return null

  const name = otherUser?.name || activeConv.participant?.name || 'Conversation'
  const isOnline = activeConv.onlineStatus?.online

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline'
    const d = new Date(lastSeen)
    return `Last seen ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white">
      {/* Top Participant Header */}
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {name[0]?.toUpperCase()}
            </div>
            {/* Social Media Online/Offline Indicator Green Dot */}
            <span
              className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {isTyping ? (
                <span className="flex items-center gap-1 font-medium text-primary">
                  <span className="inline-flex gap-0.5">
                    <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  Typing...
                </span>
              ) : isOnline ? (
                <span className="font-semibold text-emerald-600">Online</span>
              ) : (
                <span>{formatLastSeen(activeConv.onlineStatus?.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Message Banner if a message is pinned */}
      {pinnedMessage && (
        <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50/80 px-6 py-2 text-xs text-amber-800">
          <div className="flex items-center gap-2 truncate">
            <Pin className="size-3.5 shrink-0 fill-amber-500 text-amber-600" />
            <span className="font-semibold">Pinned:</span>
            <span className="truncate italic text-amber-700">{pinnedMessage.text || 'Attachment'}</span>
          </div>
          {onUnpin && (
            <button
              onClick={() => onUnpin(pinnedMessage._id)}
              className="ml-2 rounded p-1 hover:bg-amber-100"
              title="Unpin message"
            >
              <X className="size-3.5 text-amber-700" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
