import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { BASE_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const knownEvents = [
  'notification', 'application_update', 'message:new', 'message:updated',
  'typing:start', 'typing:stop', 'message:read', 'unread:update',
  'user:online', 'user:offline',
]

export function useSocket(handlers = {}) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!user) return

    const socketUrl = BASE_URL || window.location.origin
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
