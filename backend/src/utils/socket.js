const jwt = require('jsonwebtoken')
const Notification = require('../models/Notification')

// Map userId -> Set of socketIds (multi-tab support)
const onlineUsers = new Map()
// Map userId -> lastSeen timestamp
const lastSeen = new Map()

/** Parse cookie header to extract a named cookie value */
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? match[1] : null
}

const Conversation = require('../models/Conversation')

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token

      if (!token) {
        token = parseCookie(socket.handshake.headers?.cookie, 'jwt')
      }

      if (!token) return next(new Error('No token'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    // Join user's personal room for notifications/unread updates
    socket.join(String(socket.userId))

    // Track online users
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set())
    }
    onlineUsers.get(socket.userId).add(socket.id)
    lastSeen.set(socket.userId, new Date())

    // Broadcast online status to everyone
    io.emit('user:online', { userId: socket.userId })

    // Join conversation room - verify user is participant
    socket.on('conversation:join', async ({ conversationId }) => {
      if (conversationId) {
        const conv = await Conversation.findById(conversationId).select('participants').lean()
        if (conv && conv.participants.some(p => String(p) === String(socket.userId))) {
          socket.join(`conv:${conversationId}`)
        }
      }
    })

    // Leave conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`)
      }
    })

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
      })
    })

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      })
    })

    // Read receipts
    socket.on('message:read', ({ conversationId, messageIds }) => {
      socket.to(`conv:${conversationId}`).emit('message:read', {
        conversationId,
        messageIds,
        userId: socket.userId,
      })
    })

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(socket.userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId)
          lastSeen.set(socket.userId, new Date())
          io.emit('user:offline', { userId: socket.userId, lastSeen: new Date() })
        }
      }
    })
  })

  // ─── Helpers ───────────────────────────────────────────────────────────────

  // Get online status for a user
  io.getOnlineStatus = (userId) => {
    return {
      online: onlineUsers.has(String(userId)),
      lastSeen: lastSeen.get(String(userId)) || null,
    }
  }

  // Emit new message to conversation room
  io.sendMessage = (conversationId, messageData) => {
    io.to(`conv:${conversationId}`).emit('message:new', messageData)
  }

  // Emit message updated (e.g. read receipts, red-flag)
  io.updateMessage = (conversationId, messageId, updates) => {
    io.to(`conv:${conversationId}`).emit('message:updated', { messageId, updates, conversationId })
  }

  // Send notification to a specific user
  io.sendNotification = async (userId, { title, message, icon = '🔔', link }) => {
    const notif = await Notification.create({ user: userId, title, message, icon, link })
    io.to(String(userId)).emit('notification', {
      _id: notif._id,
      title,
      message,
      icon,
      link,
      createdAt: notif.createdAt,
    })
    return notif
  }

  // Emit application status update
  io.sendApplicationUpdate = (userId, data) => {
    io.to(String(userId)).emit('application_update', data)
  }

  // Update unread count badge
  io.sendUnreadUpdate = (userId, conversationId, count) => {
    io.to(String(userId)).emit('unread:update', { conversationId, count })
  }
}
