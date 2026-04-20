import pool from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export const createBorrowRequest = async (
  postId: number,
  borrowerId: number
): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO borrow_requests (post_id, borrower_id, status, created_at, updated_at)
     VALUES (?, ?, 'pending', NOW(), NOW())`,
    [postId, borrowerId]
  );
  return result;
};

export const getBorrowRequestById = async (id: number): Promise<RowDataPacket | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.*, 
            u.full_name as borrower_name,
            p.item_name as post_name,
            p.user_id as owner_id,
            ou.full_name as owner_name
     FROM borrow_requests br
     LEFT JOIN Users u ON br.borrower_id = u.id
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users ou ON p.user_id = ou.id
     WHERE br.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getRequestsByBorrower = async (borrowerId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.*,
            p.item_name as post_name,
            p.user_id as owner_id,
            u.full_name as owner_name
     FROM borrow_requests br
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users u ON p.user_id = u.id
     WHERE br.borrower_id = ?
     ORDER BY br.created_at DESC`,
    [borrowerId]
  );
  return rows;
};

export const getIncomingRequestsByOwner = async (ownerId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.*,
            p.item_name as post_name,
            u.full_name as borrower_name,
            u.profile_picture as borrower_profile_picture
     FROM borrow_requests br
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users u ON br.borrower_id = u.id
     WHERE p.user_id = ? AND br.status = 'pending'
     ORDER BY br.created_at DESC`,
    [ownerId]
  );
  return rows;
};


export const updateRequestStatus = async (
  id: number,
  status: 'approved' | 'declined'
): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE borrow_requests SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, id]
  );

  if (status === 'approved') {
    await pool.execute(
      `UPDATE posts SET status = 'borrowed' 
       WHERE id = (SELECT post_id FROM borrow_requests WHERE id = ?)`,
      [id]
    );
  } else if (status === 'declined') {
    await pool.execute(
      `UPDATE posts SET status = 'available'
       WHERE id = (SELECT post_id FROM borrow_requests WHERE id = ?)`,
      [id]
    );
  }

  return result;
};

export const getNotificationsForUser = async (userId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.*,
            p.item_name as post_name,
            u.full_name as borrower_name,
            ou.full_name as owner_name,
            ou.profile_picture as owner_profile_picture
     FROM borrow_requests br
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users u ON br.borrower_id = u.id
     LEFT JOIN Users ou ON p.user_id = ou.id
     WHERE br.borrower_id = ? AND br.status != 'pending'
     ORDER BY br.created_at DESC`,
    [userId]
  );
  return rows;
};

export const getBorrowedItemsForUser = async (userId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.id as request_id,
            br.post_id,
            br.created_at as requested_at,
            br.updated_at as approved_at,
            p.item_name as name,
            p.attachment as image,
            u.full_name as owner
     FROM borrow_requests br
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users u ON p.user_id = u.id
     WHERE br.borrower_id = ? AND br.status = 'approved'
     ORDER BY br.updated_at DESC`,
    [userId]
  );
  return rows;
};

export const getLentItemsForUser = async (userId: number): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT br.id as request_id,
            br.post_id,
            br.created_at as requested_at,
            br.updated_at as approved_at,
            p.item_name as name,
            p.attachment as image,
            u.full_name as borrower
     FROM borrow_requests br
     LEFT JOIN posts p ON br.post_id = p.id
     LEFT JOIN Users u ON br.borrower_id = u.id
     WHERE p.user_id = ? AND br.status = 'approved'
     ORDER BY br.updated_at DESC`,
    [userId]
  );
  return rows;
};