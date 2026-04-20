import type { Context } from 'hono';
import crypto from 'crypto';
import {
  createMessage,
  getMessageById,
  getThread,
  getConversations,
  markThreadAsRead,
  getUnreadCount
} from '../models/message.model.js';

const ENCRYPTION_KEY = process.env['MESSAGE_SECRET'] || 'liceo-sharesphere-secret-key-2026';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest().slice(0, 32);
const IV_LENGTH = 16;

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (encrypted: string): string => {
  try {
    const [ivHex, encryptedHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return encrypted;
  }
};

export const sendMessage = async (c: Context) => {
  try {
    const body = await c.req.json();
    const senderId = body.sender_id ?? body.senderId;
    const receiverId = body.receiver_id ?? body.receiverId;
    const messageText = body.message_text ?? body.messageText;

    if (!senderId || !receiverId || !messageText?.trim()) {
      return c.json({ message: 'Missing required fields.' }, 400);
    }

    const encryptedText = encrypt(messageText.trim());
    const result = await createMessage(Number(senderId), Number(receiverId), encryptedText);
    const msg = await getMessageById(result.insertId);

    return c.json({
      status: 'Message sent.',
      message: {
        id: msg?.id,
        senderId: msg?.sender_id,
        receiverId: msg?.receiver_id,
        messageText: decrypt(msg?.message_text ?? ''),
        isRead: Boolean(msg?.is_read),
        createdAt: msg?.created_at,
        senderName: msg?.sender_name ?? '',
        senderProfilePicture: msg?.sender_profile_picture ?? ''
      }
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getThreadHandler = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    const otherUserId = c.req.query('otherUserId') ?? c.req.query('other_user_id');

    if (!userId || !otherUserId) return c.json({ messages: [] }, 200);

    const rows = await getThread(Number(userId), Number(otherUserId));

    const messages = rows.map(r => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      messageText: decrypt(r.message_text ?? ''),
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
      senderName: r.sender_name ?? '',
      senderProfilePicture: r.sender_profile_picture ?? ''
    }));

    return c.json({ messages }, 200);
  } catch (error) {
    console.error('Get thread error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getConversationsHandler = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    if (!userId) return c.json({ conversations: [] }, 200);

    const rows = await getConversations(Number(userId));

    const conversations = rows.map(r => ({
      otherUserId: r.other_user_id,
      otherName: r.other_name ?? '',
      otherProfilePicture: r.other_profile_picture ?? '',
      lastMessage: decrypt(r.last_message ?? ''),
      lastMessageAt: r.last_message_at ?? '',
      unreadCount: Number(r.unread_count ?? 0)
    }));

    return c.json({ conversations }, 200);
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const markThreadAsReadHandler = async (c: Context) => {
  try {
    const body = await c.req.json();
    const userId = body.user_id ?? body.userId;
    const otherUserId = body.other_user_id ?? body.otherUserId;

    if (!userId || !otherUserId) return c.json({ updatedCount: 0 }, 200);

    const result = await markThreadAsRead(Number(userId), Number(otherUserId));
    return c.json({ updatedCount: result.affectedRows }, 200);
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getUnreadCountHandler = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    if (!userId) return c.json({ unreadCount: 0 }, 200);

    const count = await getUnreadCount(Number(userId));
    return c.json({ unreadCount: count }, 200);
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};