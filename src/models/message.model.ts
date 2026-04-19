import pool from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export const createMessage = async (
  senderId: number,
  receiverId: number,
  messageText: string
): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO messages (sender_id, receiver_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, 0, NOW())`,
    [senderId, receiverId, messageText]
  );
  return result;
};

export const getMessageById = async (id: number): Promise<RowDataPacket | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.*, u.full_name as sender_name
     FROM messages m
     LEFT JOIN Users u ON m.sender_id = u.id
     WHERE m.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getThread = async (
  userId: number,
  otherUserId: number
): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.*, 
            u.full_name as sender_name
     FROM messages m
     LEFT JOIN Users u ON m.sender_id = u.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [userId, otherUserId, otherUserId, userId]
  );
  return rows;
};

export const getConversations = async (userId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       other_user_id,
       other_name,
       last_message,
       last_message_at,
       unread_count
     FROM (
       SELECT 
         CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
         u.full_name as other_name,
         m.message_text as last_message,
         m.created_at as last_message_at,
         SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) 
           OVER (PARTITION BY CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) as unread_count,
         ROW_NUMBER() OVER (
           PARTITION BY CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
           ORDER BY m.created_at DESC
         ) as rn
       FROM messages m
       LEFT JOIN Users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = ? OR m.receiver_id = ?
     ) ranked
     WHERE rn = 1
     ORDER BY last_message_at DESC`,
    [userId, userId, userId, userId, userId, userId, userId]
  );
  return rows;
};

export const markThreadAsRead = async (
  userId: number,
  otherUserId: number
): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE messages SET is_read = 1
     WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
    [userId, otherUserId]
  );
  return result;
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM messages
     WHERE receiver_id = ? AND is_read = 0`,
    [userId]
  );
  return Number(rows[0]?.count ?? 0);
};
