import React, { useState } from 'react'
import { Check, CheckCheck, Smile, CornerDownLeft, Copy, Pin, Edit3, Trash2, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏']

export function SocialMessageBubble({
  message,
  isMe,
  user,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
}) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text || '')

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
      toast.success('Copied message')
    }
  }

  const handleSaveEdit = () => {
    if (!editText.trim()) return
    onEdit?.(message._id, editText.trim())
    setIsEditing(false)
  }

  // Determine read receipt status
  const hasBeenRead = (message.readBy && message.readBy.length > 0) || message.read
  const isDelivered = true // All persisted messages are delivered

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Helper to detect image attachments
  const isImageAttachment = (att) => {
    if (!att?.url) return false
    const url = att.url.toLowerCase()
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/) || att.type === 'image'
  }

  return (
    <div
      className={`group relative flex flex-col my-1.5 ${isMe ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Pinned label above bubble if pinned */}
      {message.isPinned && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 mb-0.5 px-1">
          <Pin className="size-3 fill-amber-500 text-amber-600" />
          <span>Pinned message</span>
        </div>
      )}

      {/* Hover action toolbar */}
      {showActions && !message.isDeleted && (
        <div
          className={`absolute -top-7 z-10 flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-1 text-white shadow-lg backdrop-blur-sm transition-opacity ${
            isMe ? 'right-0' : 'left-0'
          }`}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact?.(message._id, emoji)}
              className="hover:scale-125 transition-transform text-xs px-0.5"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <div className="h-3 w-px bg-white/20 mx-0.5" />
          <button
            onClick={() => onReply?.(message)}
            className="p-1 hover:text-primary transition-colors"
            title="Reply"
          >
            <CornerDownLeft className="size-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1 hover:text-primary transition-colors"
            title="Copy"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            onClick={() => onPin?.(message._id)}
            className={`p-1 transition-colors ${message.isPinned ? 'text-amber-400' : 'hover:text-amber-400'}`}
            title={message.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="size-3.5" />
          </button>
          {isMe && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:text-sky-400 transition-colors"
                title="Edit"
              >
                <Edit3 className="size-3.5" />
              </button>
              <button
                onClick={() => onDelete?.(message._id)}
                className="p-1 hover:text-rose-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Quoted Reply block if this message replied to someone */}
      {message.replyTo && message.replyTo.text && (
        <div
          className={`mb-1 max-w-xs rounded-lg border-l-4 border-primary bg-slate-100/80 px-3 py-1.5 text-xs text-slate-600 ${
            isMe ? 'mr-1' : 'ml-1'
          }`}
        >
          <p className="font-semibold text-primary">{message.replyTo.senderName || 'Replying to'}</p>
          <p className="truncate italic text-slate-500">{message.replyTo.text}</p>
        </div>
      )}

      {/* Main Message Bubble */}
      <div
        className={`relative max-w-sm sm:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
          message.isDeleted
            ? 'bg-slate-100 border border-slate-200 text-slate-400 italic'
            : isMe
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
        }`}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white outline-none focus:border-white"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded bg-white px-2 py-0.5 font-semibold text-primary hover:bg-white/90"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Text content */}
            {message.text && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.text}
              </p>
            )}

            {/* Attachments rendering */}
            {message.attachments?.length > 0 && !message.isDeleted && (
              <div className="mt-2 flex flex-col gap-2">
                {message.attachments.map((att, idx) => {
                  if (isImageAttachment(att)) {
                    return (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-white/20"
                      >
                        <img
                          src={att.url}
                          alt={att.name || 'Attachment'}
                          className="max-h-52 w-full object-cover transition-transform hover:scale-105"
                        />
                      </a>
                    )
                  }
                  return (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-colors ${
                        isMe
                          ? 'bg-white/15 text-white hover:bg-white/25'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate flex-1">{att.name || 'Document'}</span>
                      <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                    </a>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Footer info: time, edited label, and read receipt ticks */}
        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
            isMe ? 'text-white/80' : 'text-slate-400'
          }`}
        >
          {message.isEdited && !message.isDeleted && <span>(edited)</span>}
          <span>{formatTime(message.createdAt)}</span>

          {/* Social Media Read Receipt Ticks (Only for Sent messages) */}
          {isMe && !message.isDeleted && (
            <span className="inline-flex items-center" title={hasBeenRead ? 'Read' : 'Delivered'}>
              {hasBeenRead ? (
                <CheckCheck className="size-3.5 text-sky-300 font-bold" />
              ) : isDelivered ? (
                <CheckCheck className="size-3.5 text-white/70" />
              ) : (
                <Check className="size-3.5 text-white/60" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Reactions pill row */}
      {message.reactions?.length > 0 && (
        <div
          className={`mt-1 flex flex-wrap gap-1 ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.reactions.map((r, idx) => (
            <span
              key={idx}
              onClick={() => onReact?.(message._id, r.emoji)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
              title={`Reacted by ${r.user?.name || 'User'}`}
            >
              <span>{r.emoji}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
