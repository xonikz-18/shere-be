import pool from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Post {
  id?: number;
  user_id: number;
  item_name: string;
  description: string;
  attachment?: string;
  created_at?: Date;
  status?: string;
}

export const createPost = async (post: Post): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO posts (user_id, item_name, description, attachment, status)
     VALUES (?, ?, ?, ?, 'available')`,
    [post.user_id, post.item_name, post.description, post.attachment ?? null]
  );
  return result;
};

export const getAllPosts = async () => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name as owner_name, u.profile_picture as owner_profile_picture 
     FROM posts p
     LEFT JOIN Users u ON p.user_id = u.id
     ORDER BY p.created_at DESC`
  );
  return rows;
};

export const getPostById = async (id: number): Promise<RowDataPacket | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*, u.full_name as owner_name
     FROM posts p
     LEFT JOIN Users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const updatePost = async (id: number, data: Partial<Post>): Promise<ResultSetHeader> => {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE posts SET item_name = ?, description = ?, attachment = ?, status = ? WHERE id = ?`,
    [data.item_name, data.description, data.attachment ?? null, data.status ?? 'available', id]
  );

  if (data.status === 'available' || data.status === 'returned') {
    await pool.query(
      `UPDATE borrow_requests SET status = 'returned', updated_at = NOW() 
       WHERE post_id = ? AND status = 'approved'`,
      [id]
    );
  }

  return result;
};

export const deletePost = async (id: number): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM posts WHERE id = ?`,
    [id]
  );
  return result;
};