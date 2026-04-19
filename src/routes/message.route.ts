import { Hono } from 'hono';
import {
  sendMessage,
  getThreadHandler,
  getConversationsHandler,
  markThreadAsReadHandler,
  getUnreadCountHandler
} from '../controllers/message.controller.js';

const messageRoute = new Hono();

messageRoute.post('/messages', sendMessage);
messageRoute.get('/messages/conversations', getConversationsHandler);
messageRoute.get('/messages/thread', getThreadHandler);
messageRoute.get('/messages/unread-count', getUnreadCountHandler);
messageRoute.patch('/messages/thread/read', markThreadAsReadHandler);

export default messageRoute;