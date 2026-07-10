import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import {
  MessageSquare, Search, Send, Paperclip, Phone, MoreVertical,
  Users, ChevronRight, X, Check, Image, Smile
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/hooks/useSocket'
import EmojiPicker from 'emoji-picker-react'
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

export default function AgencyMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [showTextEmojiPicker, setShowTextEmojiPicker] = useState(false)
const textEmojiPickerRef = useRef(null)
   const activeIdRef = useRef(null)
   const messagesEndRef = useRef(null)
   const typingTimeoutRef = useRef(null)
   const fileInputRef = useRef(null)
   const messagesContainerRef = useRef(null)

  const { emit } = useSocket({
    'message:new': useCallback((data) => {
      if (data.sender && String(data.sender._id || data.sender) !== String(user?._id)) {
        toast.info(`New message from ${data.sender?.name || 'Company'}: ${data.text || 'Attachment'}`, { icon: '💬' })
      }
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
          c._id === data.conversationId ? { ...c, unread: data.count } : c
        )
      )
    }, []),
  })

  const loadConversations = () => {
    setLoading(true)
    api.get('/api/agency/conversations').then(data => {
      setConversations(data.conversations || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

useEffect(() => { loadConversations() }, [])

  // Handle deep-link to conversation from URL param or ?userId=X
   useEffect(() => {
     const convId = useParams().convId
     const userId = searchParams.get('userId')

     if (!user) return

     // Deep-link to existing conversation via URL param
     if (convId) {
       const existing = conversations.find(c => c._id === convId)
       if (existing) {
         setActiveChat(existing)
       } else {
         api.get(`/api/agency/conversations/${convId}`).then(data => {
           if (data?.conversation) setActiveChat(data.conversation)
         }).catch(() => {})
       }
       return
     }

     // Handle direct message from opportunity (or any ?userId=X link)
     if (!userId) return
     api.post('/api/agency/conversations/direct', { userId })
      .then((data) => {
        if (data?.conversation) {
          setConversations((prev) => {
            const exists = prev.some((c) => c._id === data.conversation._id)
            return exists ? prev : [data.conversation, ...prev]
          })
          setActiveChat(data.conversation)
        }
        setSearchParams({}, { replace: true })
      })
      .catch((err) => { toast.error(err.message || 'Could not start conversation'); setSearchParams({}, { replace: true }) })
  }, [searchParams, user, setSearchParams])

useEffect(() => {
      activeIdRef.current = activeChat?._id || null
    }, [activeChat])

  const loadMessages = async (chatId) => {
    setPage(1)
    setMessages([])
    try {
      const data = await api.get(`/api/agency/conversations/${chatId}/messages`)
      setMessages(data.messages || [])
      setTotalPages(data.totalPages || 1)
      setHasMore(data.page < data.totalPages)
    } catch (err) {
      toast.error('Failed to load messages')
    }
  }

  const loadMoreMessages = async () => {
    if (!hasMore || !activeChat) return
    const nextPage = page + 1
    const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0
    try {
      const data = await api.get(`/api/agency/conversations/${activeChat._id}/messages?page=${nextPage}&limit=50`)
      setMessages(prev => [...(data.messages || []), ...prev])
      setPage(nextPage)
      setHasMore(nextPage < data.totalPages)
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight
        }
      }, 50)
    } catch (err) {}
  }

  // Auto-scroll on initial load and new sent messages (not loadMore)
  const shouldAutoScrollRef = useRef(true)
  useEffect(() => {
      if (shouldAutoScrollRef.current && activeChat && messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        shouldAutoScrollRef.current = false
      }
    }, [messages, activeChat])

  // Reset auto-scroll flag when changing conversations
  useEffect(() => {
      shouldAutoScrollRef.current = true
    }, [activeChat])

  useEffect(() => {
      const handleClickOutside = (e) => {
        if (textEmojiPickerRef.current && !textEmojiPickerRef.current.contains(e.target)) {
          setShowTextEmojiPicker(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

useEffect(() => {
     if (activeChat) {
       loadMessages(activeChat._id)
       emit('conversation:join', { conversationId: activeChat._id })
     }
     return () => {
       if (activeChat) {
         emit('conversation:leave', { conversationId: activeChat._id })
       }
     }
   }, [activeChat, emit])

  const openChat = (conv) => {
    setActiveChat(conv)
  }

const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) return
    setSending(true)
    const currentReply = replyToMessage
    const msgText = newMessage.trim()
    const tempMsg = { _id: Date.now(), text: msgText, content: msgText, sender: user?._id, createdAt: new Date().toISOString(), temp: true }
    setMessages(prev => [...prev, tempMsg])
    setNewMessage('')
    setReplyToMessage(null)
    try {
      const data = await api.post(`/api/agency/conversations/${activeChat._id}/messages`, {
        text: msgText,
        replyTo: currentReply ? { messageId: currentReply._id, text: currentReply.text, senderName: currentReply.sender?.name } : undefined,
      })
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? (data.message || { ...tempMsg, temp: false }) : m))
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeChat._id
            ? { ...c, lastMessage: data.message?.text || '', lastMessageAt: data.message?.createdAt, lastSender: user._id }
            : c
        )
      )
    } catch (err) {
      toast.error('Failed to send')
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id))
    } finally { setSending(false) }
  }

  const handleFileUpload = async (file) => {
    if (!file || !activeChat) return
    setSending(true)
    const fd = new FormData()
    fd.append('document', file)
    fd.append('name', file.name)
    try {
      const res = await api.post('/api/agency/conversations/attachments', fd, { isFormData: true })
      if (res.fileUrl) {
        const data = await api.post(`/api/agency/conversations/${activeChat._id}/messages`, {
          text: `Sent: ${file.name}`,
          attachments: [{ name: file.name, url: res.fileUrl, type: 'other' }],
        })
        if (data?.message) {
          setMessages((prev) => [...prev, data.message])
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeChat._id
                ? { ...c, lastMessage: data.message.text, lastMessageAt: data.message.createdAt, lastSender: user._id }
                : c
            )
          )
        }
      }
    } catch (err) {
      toast.error('Failed to upload file')
    } finally {
      setSending(false)
    }
  }

  const handleReact = async (msgId, emoji) => {
    if (!activeChat) return
    try {
      const res = await api.post(`/api/agency/conversations/${activeChat._id}/messages/${msgId}/react`, { emoji })
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
      }
    } catch {}
  }

  const handleEditMessage = async (msgId, editText) => {
    if (!activeChat) return
    try {
      const res = await api.patch(`/api/agency/conversations/${activeChat._id}/messages/${msgId}`, { text: editText })
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
        toast.success('Message edited')
      }
    } catch {
      toast.error('Failed to edit message')
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!activeChat) return
    try {
      const res = await api.delete(`/api/agency/conversations/${activeChat._id}/messages/${msgId}`)
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
        toast.success('Message deleted')
      }
    } catch {
      toast.error('Failed to delete message')
    }
  }

  const handlePinMessage = async (msgId) => {
    if (!activeChat) return
    try {
      const res = await api.patch(`/api/agency/conversations/${activeChat._id}/messages/${msgId}/pin`)
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.message : m)))
      }
    } catch {}
  }

  const handleTyping = () => {
    if (!activeChat) return
    emit('typing:start', { conversationId: activeChat._id })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing:stop', { conversationId: activeChat._id })
    }, 2000)
  }

  const filteredConversations = conversations.filter(c =>
    !search || c.participant?.name?.toLowerCase().includes(search.toLowerCase()) || c.participants?.some(p => p?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const otherParticipant = (conv) =>
    conv?.participants?.find((p) => String(p._id) !== String(user?._id)) || {}

  const getUnreadCount = (conv) => conv?.unread || 0

  const isTyping = [...typingUsers].some((id) =>
    activeChat?.participants?.some((p) => String(p._id) === String(id) && String(id) !== String(user?._id))
  )

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversations Sidebar */}
        <div className="w-full max-w-sm shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-lg font-bold">Messages</h3>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <MessageSquare className="mx-auto mb-2 size-8 text-slate-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button key={conv._id} onClick={() => openChat(conv)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${activeChat?._id === conv._id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(conv.participant?.name || otherParticipant(conv)?.name || 'U')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{conv.participant?.name || otherParticipant(conv)?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-400">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}</p>
                    {getUnreadCount(conv) > 0 && (
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{getUnreadCount(conv) > 99 ? '99+' : getUnreadCount(conv)}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeChat ? (
          <div className="flex flex-1 flex-col">
            {/* Social Chat Header */}
            <SocialChatHeader
              activeConv={activeChat}
              otherUser={otherParticipant(activeChat)}
              isTyping={isTyping}
              pinnedMessage={messages.find((m) => m.isPinned)}
              onUnpin={handlePinMessage}
            />

{/* Messages */}
             <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 space-y-3" ref={messagesContainerRef}>
               {hasMore && (
                 <div className="flex justify-center py-2">
                   <button onClick={loadMoreMessages} className="text-xs font-semibold text-primary hover:underline">Load older messages</button>
                 </div>
               )}
               {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  <MessageSquare className="mr-2 size-5" /> Start a conversation
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = String(msg.sender?._id || msg.sender) === String(user?._id)
                  return (
                    <SocialMessageBubble
                      key={msg._id}
                      message={msg}
                      isMe={isMe}
                      user={user}
                      onReact={handleReact}
                      onReply={(m) => setReplyToMessage(m)}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      onPin={handlePinMessage}
                    />
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply banner above Input */}
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

            {/* Chat Input */}
            <div className="border-t border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Attach file">
                  <Paperclip className="size-5" />
                </button>
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" ref={fileInputRef} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (file && file.size <= 10 * 1024 * 1024) {
                    await handleFileUpload(file)
                  } else if (file) {
                    toast.error('File must be under 10MB')
                  }
                }} />
                <div className="relative flex-1" ref={textEmojiPickerRef}>
                  <input value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                    placeholder="Type a message..."
                    className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm outline-none focus:border-primary"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
                  <button
                    onClick={() => setShowTextEmojiPicker(!showTextEmojiPicker)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary"
                    title="Insert emoji"
                  >
                    <Smile className="size-4" />
                  </button>
                  {showTextEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                      <EmojiPicker
                        onEmojiClick={(emoji) => { setNewMessage(newMessage + emoji.emoji); setShowTextEmojiPicker(false) }}
                        width={280}
                        height={320}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                </div>
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="rounded-xl bg-primary p-2.5 text-white hover:bg-primary/90 disabled:opacity-60">
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50/50">
            <div className="text-center">
              <MessageSquare className="mx-auto size-12 text-slate-300" />
              <p className="mt-3 text-lg font-semibold text-slate-500">Select a conversation</p>
              <p className="text-sm text-slate-400">Choose a chat from the left to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}