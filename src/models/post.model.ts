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

export const getAllPosts = async (): Promise<RowDataPacket[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*, u.full_name as owner_name
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