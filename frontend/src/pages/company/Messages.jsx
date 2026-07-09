import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Send, MessageSquare, Building2, User as UserIcon,
  Check, CheckCheck, Paperclip, Search, Flag, Ban, AlertTriangle,
  Clock, Briefcase, ExternalLink, Info, Zap, Plus, X, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/hooks/useSocket'

const STATUTES = ['Shortlisted', 'Interview Scheduled', 'Offered', 'Rejected', 'Hired']

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
}

const actionStyles = {
  Shortlisted: 'bg-blue-600 hover:bg-blue-700',
  'Interview Scheduled': 'bg-violet-600 hover:bg-violet-700',
  Offered: 'bg-emerald-600 hover:bg-emerald-700',
  Rejected: 'bg-rose-600 hover:bg-rose-700',
  Hired: 'bg-emerald-600 hover:bg-emerald-700',
}

export default function CompanyMessages() {
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
  const [cannedReplies, setCannedReplies] = useState([])
  const [showCanned, setShowCanned] = useState(false)
  const [showCannedModal, setShowCannedModal] = useState(false)
  const [cannedTitle, setCannedTitle] = useState('')
  const [cannedBody, setCannedBody] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [msgSearchResults, setMsgSearchResults] = useState([])
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [searchingMsg, setSearchingMsg] = useState(false)
  const messagesEndRef = useRef(null)
  const activeIdRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const { emit } = useSocket({
    'message:new': useCallback((data) => {
      const convId = activeIdRef.current
      if (convId && String(data.conversation) === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev
          return [...prev, data]
        })
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === String(data.conversation)
            ? { ...c, lastMessage: data.text || 'Sent a file', lastMessageAt: data.createdAt, lastSender: data.sender?._id }
            : c
        )
      )
    }, []),
    'message:updated': useCallback((data) => {
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, ...data.updates } : m)))
    }, []),
    'typing:start': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setTypingUsers((prev) => new Set(prev).add(data.userId))
      }
    }, []),
    'typing:stop': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setTypingUsers((prev) => { const n = new Set(prev); n.delete(data.userId); return n })
      }
    }, []),
    'message:read': useCallback((data) => {
      if (data.conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) =>
          data.messageIds.includes(m._id) ? { ...m, readBy: [...(m.readBy || []), data.userId] } : m
        ))
      }
    }, []),
    'unread:update': useCallback((data) => {
      setConversations((prev) => prev.map((c) => c._id === data.conversationId ? { ...c, unreadCount: data.count } : c))
    }, []),
  })

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    Promise.all([
      api.get('/api/company/conversations'),
      api.get('/api/company/canned-replies'),
    ]).then(([convData, cannedData]) => {
      setConversations(convData.conversations || [])
      setCannedReplies(cannedData.cannedReplies || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Handle direct message from opportunity
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || !user) return
    api.post('/api/company/conversations/direct', { userId })
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
      api.get(`/api/company/conversations/${activeConv._id}/messages?page=1&limit=50`)
        .then((data) => {
          setMessages(data.messages || [])
          setTotalPages(data.totalPages || 1)
          setHasMore(data.page < data.totalPages)
        })
        .catch(() => {})
        .finally(() => setMsgLoading(false))
      emit('conversation:join', { conversationId: activeConv._id })
      api.post(`/api/company/conversations/${activeConv._id}/read`).catch(() => {})
    }
    return () => {
      if (activeConv) emit('conversation:leave', { conversationId: activeConv._id })
    }
  }, [activeConv, emit])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMore = async () => {
    if (!hasMore || !activeConv) return
    const nextPage = page + 1
    try {
      const data = await api.get(`/api/company/conversations/${activeConv._id}/messages?page=${nextPage}&limit=50`)
      setMessages((prev) => [...(data.messages || []), ...prev])
      setPage(nextPage)
      setHasMore(nextPage < data.totalPages)
    } catch {}
  }

  const handleSend = async (overrideText) => {
    const msgText = (overrideText || text).trim()
    if (!msgText || sending) return
    setSending(true)
    if (!overrideText) setText('')
    try {
      const data = await api.post(`/api/company/conversations/${activeConv._id}/messages`, { text: msgText })
      setMessages((prev) => [...prev, data.message])
      setConversations((prev) =>
        prev.map((c) => c._id === activeConv._id
          ? { ...c, lastMessage: data.message.text, lastMessageAt: data.message.createdAt, lastSender: user._id }
          : c
        )
      )
    } catch (err) {
      toast.error(err.message || 'Failed to send')
    } finally {
      setSending(false)
      setShowCanned(false)
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
      const data = await api.get(`/api/company/conversations/${activeConv._id}/search?q=${encodeURIComponent(q)}`)
      setMsgSearchResults(data.messages || [])
      setShowMsgSearch(true)
    } catch { setMsgSearchResults([]) }
    setSearchingMsg(false)
  }

  const handleTyping = () => {
    if (!activeConv) return
    emit('typing:start', { conversationId: activeConv._id })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing:stop', { conversationId: activeConv._id })
    }, 2000)
  }

  const handleStatusUpdate = async (status) => {
    if (!activeConv?.application?._id) return
    try {
      await api.patch(`/api/company/applications/${activeConv.application._id}/status`, { status })
      toast.success(`Status updated to ${status}`)
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id
            ? { ...c, application: { ...c.application, status } }
            : c
        )
      )
      setActiveConv((prev) => ({
        ...prev,
        application: { ...prev.application, status },
      }))
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  const handleAddCanned = async () => {
    if (!cannedTitle.trim() || !cannedBody.trim()) {
      toast.error('Title and body are required')
      return
    }
    try {
      const data = await api.post('/api/company/canned-replies', { title: cannedTitle.trim(), body: cannedBody.trim() })
      setCannedReplies(data.cannedReplies || [])
      setShowCannedModal(false)
      setCannedTitle('')
      setCannedBody('')
      toast.success('Canned reply saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
  }

  const handleDeleteCanned = async (index) => {
    try {
      const data = await api.delete(`/api/company/canned-replies/${index}`)
      setCannedReplies(data.cannedReplies || [])
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    try {
      await api.post('/api/company/report-conversation', {
        conversationId: activeConv._id,
        reason: reportReason.trim(),
        description: reportDesc.trim(),
      })
      toast.success('Report submitted.')
      setShowReportModal(false)
      setReportReason('')
      setReportDesc('')
    } catch (err) {
      toast.error(err.message || 'Failed to submit report')
    }
  }

  const handleBlock = async () => {
    if (!confirm('Block this conversation?')) return
    try {
      await api.post(`/api/company/conversations/${activeConv._id}/block`)
      toast.success('Conversation blocked')
      setActiveConv(null)
    } catch (err) {
      toast.error(err.message || 'Failed to block')
    }
  }

  const otherParticipant = (conv) => conv?.participants?.find((p) => p._id !== user._id) || {}
  const getUnreadCount = (conv) => conv?.unreadCount || 0

  const filteredConvs = conversations.filter((conv) => {
    if (!searchQuery) return true
    const other = otherParticipant(conv)
    return other.name?.toLowerCase().includes(searchQuery.toLowerCase()) || conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary lg:hidden">
              <ArrowLeft className="size-4" /> Back
            </Link>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight">Messages</h2>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-slate-400">
              <MessageSquare className="mb-2 size-8 text-slate-300" />
              <p className="font-semibold text-slate-600">{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
              <p className="mt-1 text-xs">When candidates reach out, they'll appear here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.map((conv) => {
                const other = otherParticipant(conv)
                const unread = getUnreadCount(conv)
                return (
                  <button key={conv._id} onClick={() => setActiveConv(conv)}
                    className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${activeConv?._id === conv._id ? 'bg-primary/5' : ''} ${conv.status === 'blocked' ? 'opacity-60' : ''}`}>
                    <div className="relative shrink-0">
                      <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                        <UserIcon className="size-4" />
                      </div>
                      {conv.onlineStatus?.online && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-foreground">{other.name || 'Unknown'}</span>
                        <span className="shrink-0 text-xs text-slate-400">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</span>
                      </div>
                      <p className={`truncate text-xs ${unread > 0 ? 'font-bold text-foreground' : 'text-slate-500'}`}>{conv.lastMessage || 'No messages yet'}</p>
                    </div>
                    {unread > 0 && <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
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
                <p className="mt-1">Choose a conversation to start responding.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Context Header */}
              <div className="border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setActiveConv(null)} className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden">
                    <ArrowLeft className="size-5 text-slate-500" />
                  </button>
                  <div className="relative shrink-0">
                    <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                      <UserIcon className="size-4" />
                    </div>
                    {activeConv?.onlineStatus?.online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{activeConvOther?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">
                      {activeConv?.onlineStatus?.online ? 'Online' : activeConv?.onlineStatus?.lastSeen ? `Last seen ${timeAgo(activeConv.onlineStatus.lastSeen)}` : 'Offline'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowReportModal(true)} title="Report" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Flag className="size-4" /></button>
                    <button onClick={handleBlock} title="Block" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Ban className="size-4" /></button>
                  </div>
                </div>

                {/* Job Context Bar */}
                {activeConv.posting && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <Briefcase className="size-3.5 shrink-0 text-primary" />
                      <Link to={`/${activeConv.postingModel?.toLowerCase() || 'job'}/${activeConv.posting?._id}`} className="truncate font-semibold text-primary hover:underline">
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

                {/* Quick Actions */}
                {activeConv.application?._id && (
                  <div className="flex gap-1.5 border-t border-slate-100 px-4 py-2">
                    {STATUTES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(s)}
                        disabled={activeConv.application?.status === s}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold text-white transition-colors disabled:opacity-40 ${actionStyles[s] || 'bg-slate-400 hover:bg-slate-500'}`}
                      >
                        {s === 'Interview Scheduled' ? 'Interview' : s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search messages */}
              <div className="border-b border-slate-200 bg-white px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={msgSearchQuery}
                    onChange={(e) => handleMsgSearch(e.target.value)}
                    placeholder="Search in this conversation..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs outline-none focus:border-primary"
                  />
                  {msgSearchQuery && (
                    <button onClick={() => { handleMsgSearch(''); setShowMsgSearch(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                {showMsgSearch && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    {searchingMsg ? (
                      <p className="p-2 text-center text-xs text-slate-400">Searching...</p>
                    ) : msgSearchResults.length === 0 ? (
                      <p className="p-2 text-center text-xs text-slate-400">No matches found</p>
                    ) : (
                      msgSearchResults.map((m) => (
                        <div key={m._id} className="rounded-lg px-3 py-2 text-xs hover:bg-slate-50">
                          <p className="font-semibold text-slate-600">{m.sender?.name}</p>
                          <p className="text-slate-500">{m.text || (m.attachments?.[0]?.name || '')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center p-8"><div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
                ) : (
                  <div className="space-y-1 p-4">
                    {hasMore && (
                      <div className="flex justify-center py-2">
                        <button onClick={loadMore} className="text-xs font-semibold text-primary hover:underline">Load older messages</button>
                      </div>
                    )}
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center py-16 text-center text-sm text-slate-400">
                        <div><MessageSquare className="mx-auto mb-2 size-8 text-slate-300" /><p>No messages yet. Send a message to get started.</p></div>
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
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`group max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-slate-700 shadow-sm'}`}>
                                {msg.attachments?.length > 0 && (
                                  <div className="mb-1.5 space-y-1">
                                    {msg.attachments.map((att, i) => (
                                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        <Paperclip className="size-3" /><span className="truncate">{att.name}</span><ExternalLink className="size-3 shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {msg.text && <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-700'}`}>{msg.text}</p>}
                                {msg.redFlagged && (
                                  <div className="mt-1 flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                                    <AlertTriangle className="size-3" /> Flagged
                                  </div>
                                )}
                                <div className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                                  <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</span>
                                  {isMe && (
                                    msg.readBy?.length > 0
                                      ? <CheckCheck className="size-3 text-blue-300" />
                                      : <Check className="size-3 text-white/50" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {isTyping && <div className="px-4 py-1 text-xs text-slate-400 italic">{activeConvOther?.name} is typing...</div>}

              {activeConv.status === 'blocked' ? (
                <div className="border-t border-slate-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-600">This conversation has been blocked</div>
              ) : (
                <div className="border-t border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" ref={fileInputRef} className="hidden" onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB.'); return }
                      const fd = new FormData()
                      fd.append('document', file)
                      fd.append('name', file.name)
                      try {
                        const res = await api.post('/api/company/documents/upload', fd, { isFormData: true })
                        const url = res.documents?.[res.documents.length - 1]?.url
                        if (url) {
                          await api.post(`/api/company/conversations/${activeConv._id}/messages`, {
                            text: `Sent: ${file.name}`,
                            attachments: [{ name: file.name, url, type: file.type.includes('resume') ? 'resume' : 'other' }],
                          })
                        }
                        toast.success('File sent')
                      } catch (err) { toast.error(err.message || 'Upload failed') }
                      e.target.value = ''
                    }} />
                    <button onClick={() => fileInputRef.current?.click()} title="Attach file" className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-primary">
                      <Paperclip className="size-4" />
                    </button>

                    {/* Canned Replies */}
                    <div className="relative">
                      <button onClick={() => setShowCanned(!showCanned)} title="Quick replies" className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-primary">
                        <Zap className="size-4" />
                      </button>
                      {showCanned && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowCanned(false)} />
                          <div className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                            <div className="mb-2 flex items-center justify-between px-2">
                              <span className="text-xs font-bold uppercase text-slate-500">Quick Replies</span>
                              <button onClick={() => { setShowCannedModal(true); setShowCanned(false) }} className="rounded-lg p-1 text-primary hover:bg-primary/10">
                                <Plus className="size-4" />
                              </button>
                            </div>
                            {cannedReplies.length === 0 ? (
                              <p className="px-2 py-4 text-center text-xs text-slate-400">No quick replies yet.<br />Create one to save time.</p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {cannedReplies.map((cr, i) => (
                                  <div key={i} className="group flex items-start gap-1 rounded-xl p-2 hover:bg-slate-50">
                                    <button onClick={() => { handleSend(cr.body) }} className="flex-1 text-left">
                                      <p className="text-xs font-bold text-foreground">{cr.title}</p>
                                      <p className="truncate text-[10px] text-slate-500">{cr.body}</p>
                                    </button>
                                    <button onClick={() => handleDeleteCanned(i)} className="shrink-0 rounded p-1 text-slate-300 opacity-0 hover:text-rose-500 group-hover:opacity-100">
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <input value={text} onChange={(e) => { setText(e.target.value); handleTyping() }}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                      placeholder="Type a message..." className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary" />
                    <button onClick={() => handleSend()} disabled={!text.trim() || sending}
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
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
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Select a reason...</option>
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Inappropriate">Inappropriate content</option>
              <option value="Other">Other</option>
            </select>
            <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Additional details (optional)" rows={3} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowReportModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Canned Reply Modal */}
      {showCannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowCannedModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-foreground">Add Quick Reply</h3>
            <input value={cannedTitle} onChange={(e) => setCannedTitle(e.target.value)} placeholder="Title (e.g. Thank you)" className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <textarea value={cannedBody} onChange={(e) => setCannedBody(e.target.value)} placeholder="Reply body..." rows={3} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCannedModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddCanned} disabled={!cannedTitle.trim() || !cannedBody.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">Save</button>
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
