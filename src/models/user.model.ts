import pool from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface User {
  id?: number;
  fullname: string;
  email: string;
  sex: 'Male' | 'Female';
  department: string;
  contact_number: string;
  password: string;
  created_at?: Date;
}

export const createUser = async (user: User): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Users (full_name, email, sex, department, contact_number, password)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.fullname, user.email, user.sex, user.department, user.contact_number, user.password]
  );
  return result;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM Users WHERE email = ?`,
    [email]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};