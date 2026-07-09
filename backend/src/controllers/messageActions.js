const Message = require('../models/Message')
const Conversation = require('../models/Conversation')

async function reactToMessage(req, res) {
  try {
    const { msgId } = req.params
    const { emoji } = req.body
    if (!emoji) return res.status(400).json({ message: 'Emoji required' })

    const msg = await Message.findById(msgId)
    if (!msg) return res.status(404).json({ message: 'Message not found' })

    const existingIndex = msg.reactions.findIndex(
      (r) => String(r.user) === String(req.user._id) && r.emoji === emoji
    )

    if (existingIndex > -1) {
      msg.reactions.splice(existingIndex, 1)
    } else {
      msg.reactions = msg.reactions.filter((r) => String(r.user) !== String(req.user._id))
      msg.reactions.push({ user: req.user._id, emoji })
    }

    await msg.save()
    const populated = await Message.findById(msg._id).populate('sender', 'name email role').populate('reactions.user', 'name')

    const io = req.app.get('io')
    if (io) {
      const conv = await Conversation.findById(msg.conversation)
      conv?.participants?.forEach((pId) => {
        io.to(`user:${pId}`).emit('message:updated', {
          messageId: msg._id,
          updates: { reactions: populated.reactions },
        })
      })
    }

    res.json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function editMessage(req, res) {
  try {
    const { msgId } = req.params
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' })

    const msg = await Message.findOne({ _id: msgId, sender: req.user._id })
    if (!msg) return res.status(404).json({ message: 'Message not found or unauthorized' })

    msg.text = text.trim()
    msg.isEdited = true
    await msg.save()

    const populated = await Message.findById(msg._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      const conv = await Conversation.findById(msg.conversation)
      conv?.participants?.forEach((pId) => {
        io.to(`user:${pId}`).emit('message:updated', {
          messageId: msg._id,
          updates: { text: msg.text, isEdited: true },
        })
      })
    }

    res.json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function deleteMessage(req, res) {
  try {
    const { msgId } = req.params
    const msg = await Message.findOne({ _id: msgId, sender: req.user._id })
    if (!msg) return res.status(404).json({ message: 'Message not found or unauthorized' })

    msg.text = 'This message was deleted'
    msg.attachments = []
    msg.isDeleted = true
    await msg.save()

    const populated = await Message.findById(msg._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      const conv = await Conversation.findById(msg.conversation)
      conv?.participants?.forEach((pId) => {
        io.to(`user:${pId}`).emit('message:updated', {
          messageId: msg._id,
          updates: { text: msg.text, attachments: [], isDeleted: true },
        })
      })
    }

    res.json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function pinMessage(req, res) {
  try {
    const { msgId } = req.params
    const msg = await Message.findById(msgId)
    if (!msg) return res.status(404).json({ message: 'Message not found' })

    msg.isPinned = !msg.isPinned
    await msg.save()

    const populated = await Message.findById(msg._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      const conv = await Conversation.findById(msg.conversation)
      conv?.participants?.forEach((pId) => {
        io.to(`user:${pId}`).emit('message:updated', {
          messageId: msg._id,
          updates: { isPinned: msg.isPinned },
        })
      })
    }

    res.json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  reactToMessage,
  editMessage,
  deleteMessage,
  pinMessage,
}
