import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '@/context/AuthContext'

const knownEvents = [
  'notification', 'application_update', 'message:new', 'message:updated',
  'typing:start', 'typing:stop', 'message:read', 'unread:update',
  'user:online', 'user:offline',
]

// Get backend URL - use env var or fallback to localhost:5000
const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // Development: connect to backend server directly
  if (import.meta.env.DEV) return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
  return window.location.origin
}

export function useSocket(handlers = {}) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!user) return

    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    const eventHandlers = {}
    knownEvents.forEach((event) => {
      const handler = (data) => handlersRef.current[event]?.(data)
      eventHandlers[event] = handler
      socket.on(event, handler)
    })

    return () => {
      knownEvents.forEach((event) => {
        socket.off(event, eventHandlers[event])
      })
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?._id])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { socketRef, emit }
}
