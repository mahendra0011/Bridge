import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  MessageSquare, Search, Send, Paperclip, Phone, MoreVertical,
  Users, ChevronRight, X, Check, Image, Smile
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

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

  const loadConversations = () => {
    setLoading(true)
    api.get('/api/agency/conversations').then(data => {
      setConversations(data.conversations || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadConversations() }, [])

  // Handle direct message from opportunity
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || !user) return
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

  const loadMessages = async (chatId) => {
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
    try {
      const data = await api.get(`/api/agency/conversations/${activeChat._id}/messages?page=${nextPage}&limit=50`)
      setMessages(prev => [...prev, ...data.messages])
      setPage(nextPage)
      setHasMore(nextPage < data.totalPages)
    } catch (err) {}
  }

  const openChat = (conv) => {
    setActiveChat(conv)
    if (conv._id) loadMessages(conv._id)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) return
    setSending(true)
    const tempMsg = { _id: Date.now(), content: newMessage, sender: user?._id, createdAt: new Date().toISOString(), temp: true }
    setMessages(prev => [...prev, tempMsg])
    setNewMessage('')
    try {
      const data = await api.post(`/api/agency/conversations/${activeChat._id}/messages`, { content: newMessage.trim() })
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data.message || { ...tempMsg, temp: false } : m))
    } catch (err) {
      toast.error('Failed to send')
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id))
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    !search || c.participant?.name?.toLowerCase().includes(search.toLowerCase())
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
                    {(conv.participant?.name || 'U')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{conv.participant?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-400">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}</p>
                    {conv.unread > 0 && (
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{conv.unread}</span>
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
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(activeChat.participant?.name || 'U')[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{activeChat.participant?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{activeChat.participant?.email || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Phone className="size-4" /></button>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreVertical className="size-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  <MessageSquare className="mr-2 size-5" /> Start a conversation
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = String(msg.sender?._id || msg.sender) === String(user?._id)
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white border border-slate-200 rounded-bl-md'
                      }`}>
                        <p>{msg.text || msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Paperclip className="size-5" /></button>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
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