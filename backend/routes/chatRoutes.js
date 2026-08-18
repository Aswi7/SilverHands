const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage
} = require('../controllers/chatController');

router.post('/conversations', protect, createOrGetConversation);
router.get('/conversations', protect, getUserConversations);
router.get('/conversations/:id/messages', protect, getConversationMessages);
router.post('/conversations/:id/messages', protect, sendMessage);

module.exports = router;
