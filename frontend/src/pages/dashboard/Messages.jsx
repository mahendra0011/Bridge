import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Send, MessageSquare, Building2, User as UserIcon,
  Check, CheckCheck, Paperclip, Search, Flag, Ban, AlertTriangle,
  Clock, Briefcase, MapPin, ExternalLink, Info, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/hooks/useSocket'
import { SocialMessageBubble } from '@/components/chat/SocialMessageBubble'
import { SocialChatHeader } from '@/components/chat/SocialChatHeader'

function timeAgo(date) {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const statusStyles = {
  Applied: 'bg-slate-100 text-slate-700',
  'Under Review': 'bg-amber-50 text-amber-700',
  Shortlisted: 'bg-blue-50 text-blue-700',
  'Interview Scheduled': 'bg-violet-50 text-violet-700',
  Rejected: 'bg-rose-50 text-rose-700',
  Offered: 'bg-emerald-50 text-emerald-700',
  Hired: 'bg-emerald-50 text-emerald-700',
  Selected: 'bg-emerald-50 text-emerald-700',
}

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const messagesEndRef = useRef(null)
  const activeIdRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [msgSearchResults, setMsgSearchResults] = useState([])
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [searchingMsg, setSearchingMsg] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState(null)

  const { emit } = useSocket({
    'message:new': useCallback((data) => {
      const convId = activeIdRef.current
      if (convId && String(data.conversation || data._id?.conversation) === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev
          return [...prev, data]
        })
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === String(data.conversation || data._id?.conversation)
            ? { ...c, lastMessage: data.text || 'Sent a file', lastMessageAt: data.createdAt, lastSender: data.sender?._id }
            : c
        )
      )
    }, []),
    'message:updated': useCallback((data) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === data.messageId ? { ...m, ...data.updates } : m))
      )
    }, []),
    'typing:start': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setTypingUsers((prev) => new Set(prev).add(data.userId))
      }
    }, []),
    'typing:stop': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(data.userId)
          return next
        })
      }
    }, []),
    'message:read': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!data.messageIds.includes(m._id)) return m
            if (String(m.sender?._id || m.sender) === String(data.userId)) return m
            if ((m.readBy || []).includes(data.userId)) return m
            return { ...m, readBy: [...(m.readBy || []), data.userId] }
          })
        )
      }
    }, []),
    'unread:update': useCallback((data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId ? { ...c, unreadCount: data.count } : c
        )
      )
    }, []),
    'user:online': useCallback((data) => {
      setConversations((prev) =>
        prev.map((c) => {
          const other = c.participants?.find((p) => p._id !== user._id)
          if (other?._id === data.userId) {
            return { ...c, onlineStatus: { online: true, lastSeen: null } }
          }
          return c
        })
      )
    }, [user._id]),
    'user:offline': useCallback((data) => {
      setConversations((prev) =>
        prev.map((c) => {
          const other = c.participants?.find((p) => p._id !== user._id)
          if (other?._id === data.userId) {
            return { ...c, onlineStatus: { online: false, lastSeen: data.lastSeen } }
          }
          return c
        })
      )
    }, [user._id]),
  })

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    api.get('/api/student/conversations')
      .then((data) => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Handle direct message from opportunity (or any ?userId=X link)
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || !user) return
    api.post('/api/student/conversations/direct', { userId })
      .then((data) => {
        if (data?.conversation) {
          setConversations((prev) => {
            const exists = prev.some((c) => c._id === data.conversation._id)
            return exists ? prev : [data.conversation, ...prev]
          })
          setActiveConv(data.conversation)
        }
        setSearchParams({}, { replace: true })
      })
      .catch((err) => { toast.error(err.message || 'Could not start conversation'); setSearchParams({}, { replace: true }) })
  }, [searchParams, user, setSearchParams])

  useEffect(() => {
    activeIdRef.current = activeConv?._id || null
  }, [activeConv])

  useEffect(() => {
    if (activeConv) {
      setMsgLoading(true)
      setPage(1)
      setMessages([])
      api.get(`/api/student/conversations/${activeConv._id}/messages?page=1&limit=50`)
        .then((data) => {
          setMessages(data.messages || [])
          setTotalPages(data.totalPages || 1)
          setHasMore(data.page < data.totalPages)
        })
        .catch(() => {})
        .finally(() => setMsgLoading(false))
      emit('conversation:join', { conversationId: activeConv._id })

      // Mark as read
      api.post(`/api/student/conversations/${activeConv._id}/read`).catch(() => {})
    }
    return () => {
      if (activeConv) {
        emit('conversation:leave', { conversationId: activeConv._id })
      }
    }
  }, [activeConv, emit])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMore = async () => {
    if (!hasMore || !activeConv) return
    const nextPage = page + 1
    try {
      const data = await api.get(`/api/student/conversations/${activeConv._id}/messages?page=${nextPage}&limit=50`)
      setMessages((prev) => [...(data.messages || []), ...prev])
      setPage(nextPage)
      setHasMore(nextPage < data.totalPages)
    } catch {}
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msgText = text.trim()
    const currentReply = replyToMessage
    setText('')
    setReplyToMessage(null)
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId, text: msgText, sender: { _id: user._id, name: user.name, role: 'student' },
        senderRole: 'student', messageType: 'text', createdAt: new Date().toISOString(),
        readBy: [], sending: true,
        replyTo: currentReply ? { messageId: currentReply._id, text: currentReply.text, senderName: currentReply.sender?.name } : undefined,
      },
    ])
    try {
      const data = await api.post(`/api/student/conversations/${activeConv._id}/messages`, {
        text: msgText,
        replyTo: currentReply ? { messageId: currentReply._id, text: currentReply.text, senderName: currentReply.sender?.name } : undefined,
      })
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...data.message } : m)))
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id
            ? { ...c, lastMessage: data.message.text, lastMessageAt: data.message.createdAt, lastSender: user._id }
            : c
        )
      )
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, failed: true } : m)))
      toast.error(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleReact = async (msgId, emoji) => {
    if (!activeConv) return
    try {
      const res = await api.post(`/api/student/conversations/${activeConv._id}/messages/${msgId}/react`, { emoji })
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
      }
    } catch {}
  }

  const handleEditMessage = async (msgId, editText) => {
    if (!activeConv) return
    try {
      const res = await api.patch(`/api/student/conversations/${activeConv._id}/messages/${msgId}`, { text: editText })
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
        toast.success('Message edited')
      }
    } catch {
      toast.error('Failed to edit message')
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!activeConv) return
    try {
      const res = await api.delete(`/api/student/conversations/${activeConv._id}/messages/${msgId}`)
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
        toast.success('Message deleted')
      }
    } catch {
      toast.error('Failed to delete message')
    }
  }

  const handlePinMessage = async (msgId) => {
    if (!activeConv) return
    try {
      const res = await api.patch(`/api/student/conversations/${activeConv._id}/messages/${msgId}/pin`)
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
      }
    } catch {}
  }

  const handleTyping = () => {
    if (!activeConv) return
    emit('typing:start', { conversationId: activeConv._id })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing:stop', { conversationId: activeConv._id })
    }, 2000)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB.')
      return
    }
    const fd = new FormData()
    fd.append('resume', file)
    fd.append('name', file.name)
    try {
      const doc = await api.post('/api/student/documents', fd, { isFormData: true })
      const data = await api.post(`/api/student/conversations/${activeConv._id}/messages`, {
        text: `Sent: ${file.name}`,
        attachments: [{ name: file.name, url: doc.document.url, type: file.type.includes('resume') ? 'resume' : 'other' }],
      })
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConv._id
              ? { ...c, lastMessage: data.message.text || 'Sent a file', lastMessageAt: data.message.createdAt, lastSender: user._id }
              : c
          )
        )
      }
      toast.success('File sent')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    }
    e.target.value = ''
  }

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    try {
      await api.post('/api/student/report-conversation', {
        conversationId: activeConv._id,
        reason: reportReason.trim(),
        description: reportDesc.trim(),
      })
      toast.success('Report submitted. Admin will review.')
      setShowReportModal(false)
      setReportReason('')
      setReportDesc('')
    } catch (err) {
      toast.error(err.message || 'Failed to submit report')
    }
  }

  const handleBlock = async () => {
    if (!confirm('Block this conversation? You will no longer receive messages from this user.')) return
    try {
      await api.post(`/api/student/conversations/${activeConv._id}/block`)
      toast.success('Conversation blocked')
      setActiveConv(null)
    } catch (err) {
      toast.error(err.message || 'Failed to block')
    }
  }

  const handleMsgSearch = async (q) => {
    setMsgSearchQuery(q)
    if (!q.trim() || !activeConv) {
      setShowMsgSearch(false)
      setMsgSearchResults([])
      return
    }
    setSearchingMsg(true)
    try {
      const data = await api.get(`/api/student/conversations/${activeConv._id}/search?q=${encodeURIComponent(q)}`)
      setMsgSearchResults(data.messages || [])
      setShowMsgSearch(true)
    } catch { setMsgSearchResults([]) }
    setSearchingMsg(false)
  }

  const otherParticipant = (conv) =>
    conv?.participants?.find((p) => String(p._id) !== String(user._id)) || {}

  const getUnreadCount = (conv) => conv?.unreadCount || 0

  const filteredConvs = conversations.filter((conv) => {
    if (!searchQuery) return true
    const other = otherParticipant(conv)
    return (
      other.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const activeConvOther = activeConv ? otherParticipant(activeConv) : null
  const isTyping = [...typingUsers].some((id) =>
    activeConv?.participants?.some((p) => String(p._id) === String(id) && String(id) !== String(user._id))
  )

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
        {/* Conversations List */}
        <div className={`flex w-full flex-col border-r border-slate-200 bg-white lg:w-80 ${activeConv ? 'hidden lg:flex' : ''}`}>
          <div className="border-b border-slate-100 p-4">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary lg:hidden">
              <ArrowLeft className="size-4" /> Back
            </Link>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight">Messages</h2>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-slate-400">
              <MessageSquare className="mb-2 size-8 text-slate-300" />
              <p className="font-semibold text-slate-600">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="mt-1 text-xs">
                {searchQuery ? 'Try a different search term.' : "When recruiters reach out, they'll appear here."}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.map((conv) => {
                const other = otherParticipant(conv)
                const unread = getUnreadCount(conv)
                const isOnline = conv.onlineStatus?.online
                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      activeConv?._id === conv._id ? 'bg-primary/5' : ''
                    } ${conv.status === 'blocked' ? 'opacity-60' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                        {other.role === 'company' ? <Building2 className="size-4" /> : <UserIcon className="size-4" />}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-foreground">{other.name || 'Unknown'}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className={`truncate text-xs ${unread > 0 ? 'font-bold text-foreground' : 'text-slate-500'}`}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`flex flex-1 flex-col ${!activeConv ? 'hidden lg:flex' : ''}`}>
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-slate-400">
              <div>
                <MessageSquare className="mx-auto mb-3 size-12 text-slate-300" />
                <p className="font-semibold text-slate-600">Select a conversation</p>
                <p className="mt-1">Choose a conversation from the left to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Context Header with Online/Offline & Typing & Pinned Bar */}
              <SocialChatHeader
                activeConv={activeConv}
                otherUser={activeConvOther}
                isTyping={isTyping}
                pinnedMessage={messages.find((m) => m.isPinned)}
                onUnpin={handlePinMessage}
              />

              {/* Job Context Bar */}
              {activeConv.posting && (
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Briefcase className="size-3.5 shrink-0 text-primary" />
                    <Link
                      to={`/${activeConv.postingModel?.toLowerCase() || 'job'}/${activeConv.posting?._id}`}
                      className="truncate font-semibold text-primary hover:underline"
                    >
                      {activeConv.posting.title || 'Position'}
                    </Link>
                    {activeConv.application?.status && (
                      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[activeConv.application.status] || 'bg-slate-100 text-slate-600'}`}>
                        {activeConv.application.status}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-1 p-4">
                    {hasMore && (
                      <div className="flex justify-center py-2">
                        <button onClick={loadMore} className="text-xs font-semibold text-primary hover:underline">
                          Load older messages
                        </button>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center py-16 text-center text-sm text-slate-400">
                        <div>
                          <MessageSquare className="mx-auto mb-2 size-8 text-slate-300" />
                          <p>No messages yet. Say hello!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = String(msg.sender?._id || msg.sender) === String(user._id)
                        const isSystem = msg.messageType === 'system'
                        const prevMsg = idx > 0 ? messages[idx - 1] : null
                        const showDateSeparator = msg.createdAt && prevMsg?.createdAt &&
                          new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()

                        if (isSystem) {
                          return (
                            <div key={msg._id}>
                              {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                              <div className="flex justify-center py-2">
                                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500">
                                  <Info className="size-3" />
                                  <span>{msg.text}</span>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div key={msg._id}>
                            {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                            <SocialMessageBubble
                              message={msg}
                              isMe={isMe}
                              user={user}
                              onReact={handleReact}
                              onReply={(m) => setReplyToMessage(m)}
                              onEdit={handleEditMessage}
                              onDelete={handleDeleteMessage}
                              onPin={handlePinMessage}
                            />
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Blocked Notice */}
              {activeConv.status === 'blocked' ? (
                <div className="border-t border-slate-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-600">
                  This conversation has been blocked
                </div>
              ) : (
                <>
                  {/* Quoted Reply Banner above Input */}
                  {replyToMessage && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-600">
                      <div className="truncate">
                        <span className="font-semibold text-primary">Replying to {replyToMessage.sender?.name || 'message'}:</span>{' '}
                        <span className="italic">{replyToMessage.text || 'Attachment'}</span>
                      </div>
                      <button onClick={() => setReplyToMessage(null)} className="p-1 hover:text-rose-500">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <div className="border-t border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach media or file"
                        className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-primary"
                      >
                        <Paperclip className="size-4" />
                      </button>
                      <input
                        value={text}
                        onChange={(e) => { setText(e.target.value); handleTyping() }}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Type a message or paste emojis..."
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-foreground">Report Conversation</h3>
            <p className="mt-1 text-sm text-slate-500">Why are you reporting this conversation?</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Select a reason...</option>
              <option value="Spam">Spam or unsolicited messages</option>
              <option value="Fake job offer">Fake job offer</option>
              <option value="Harassment">Harassment or inappropriate content</option>
              <option value="Scam">Scam or fraudulent request</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 border-t border-slate-200" />
      <span className="text-xs font-semibold text-slate-400">{formatDate(date)}</span>
      <div className="flex-1 border-t border-slate-200" />
    </div>
  )
}
