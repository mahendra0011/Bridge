import React, { useState, useRef, useEffect } from 'react'
import { Check, CheckCheck, Smile, CornerDownLeft, Copy, Pin, Edit3, Trash2, FileText, ExternalLink, Plus } from 'lucide-react'
import { toast } from 'sonner'
import EmojiPicker from 'emoji-picker-react'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🙏']

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
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileEmojiPickers, setShowFileEmojiPickers] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text || '')
  const quickReactionsRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const fileEmojiPickerRefs = useRef({})

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

  const handleEmojiClick = (emojiData) => {
    onReact?.(message._id, emojiData.emoji)
    setShowEmojiPicker(false)
    setShowQuickReactions(false)
  }

  const handleQuickEmojiClick = (emoji) => {
    onReact?.(message._id, emoji)
  }

  const handleFileEmojiClick = (emojiData, attIdx) => {
    onReact?.(message._id, emojiData.emoji)
    setShowFileEmojiPickers(prev => ({ ...prev, [attIdx]: false }))
  }

  const toggleFileEmojiPicker = (attIdx) => {
    setShowFileEmojiPickers(prev => ({ ...prev, [attIdx]: !prev[attIdx] }))
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickReactionsRef.current && !quickReactionsRef.current.contains(e.target)) {
        setShowQuickReactions(false)
        setShowEmojiPicker(false)
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
      }
      Object.keys(showFileEmojiPickers).forEach(key => {
        if (showFileEmojiPickers[key]) {
          const ref = fileEmojiPickerRefs.current[key]
          if (ref && !ref.contains(e.target)) {
            setShowFileEmojiPickers(prev => ({ ...prev, [key]: false }))
          }
        }
      })
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFileEmojiPickers])

  const hasBeenRead = (message.readBy && message.readBy.length > 0) || message.read
  const isDelivered = true

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
      {message.isPinned && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 mb-0.5 px-1">
          <Pin className="size-3 fill-amber-500 text-amber-600" />
          <span>Pinned message</span>
        </div>
      )}

      {showActions && !message.isDeleted && (
        <div
          className={`absolute -top-8 z-20 flex items-center gap-0.5 rounded-full bg-slate-800/90 px-1.5 py-1 text-white shadow-lg backdrop-blur-sm transition-opacity ${
            isMe ? 'right-0' : 'left-0'
          }`}
        >
          <div className="relative" ref={quickReactionsRef}>
            <button
              onClick={() => setShowQuickReactions(!showQuickReactions)}
              className="p-0.5 hover:text-primary transition-colors"
              title="React"
            >
              <Smile className="size-4" />
            </button>
            {showQuickReactions && (
              <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} z-30 bg-slate-800/95 rounded-full px-1.5 py-1 flex items-center gap-0.5`}>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickEmojiClick(emoji)}
                    className="hover:scale-125 transition-transform text-2xl px-1"
                    title={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="p-0.5 hover:text-primary transition-colors"
                  title="More reactions"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            )}
            {showEmojiPicker && (
              <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} z-30`}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={350}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>
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
            {message.text && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.text}
              </p>
            )}

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
                    <div key={idx} className="flex items-center gap-2">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-colors flex-1 ${
                          isMe
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <FileText className="size-4 shrink-0" />
                        <span className="truncate flex-1">{att.name || 'Document'}</span>
                        <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                      </a>
                      <div
                        className="relative"
                        ref={el => fileEmojiPickerRefs.current[idx] = el}
                      >
                        <button
                          onClick={() => toggleFileEmojiPicker(idx)}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Add reaction to file"
                        >
                          <Smile className="size-4 text-slate-500" />
                        </button>
                        {showFileEmojiPickers[idx] && (
                          <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} z-30`}>
                            <EmojiPicker
                              onEmojiClick={(emoji) => handleFileEmojiClick(emoji, idx)}
                              width={280}
                              height={320}
                              previewConfig={{ showPreview: false }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
            isMe ? 'text-white/80' : 'text-slate-400'
          }`}
        >
          {message.isEdited && !message.isDeleted && <span>(edited)</span>}
          <span>{formatTime(message.createdAt)}</span>

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

      {message.reactions?.length > 0 && (
        <div
          className={`mt-1 flex flex-wrap gap-1.5 ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.reactions.map((r, idx) => (
            <span
              key={idx}
              onClick={() => onReact?.(message._id, r.emoji)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
              title={`Reacted by ${r.user?.name || 'User'}`}
            >
              <span className="text-base">{r.emoji}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}