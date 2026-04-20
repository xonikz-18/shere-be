import type { Context } from 'hono';
import { findUserByEmail } from '../models/user.model.js';
import type { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

export const forgotPassword = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ message: 'Email is required.' }, 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ message: 'No account found with that email.' }, 404);
    }

    return c.json({ message: 'Email found.' }, 200);

  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const resetPassword = async (c: Context) => {
  try {
    const { email, newPassword } = await c.req.json();

    if (!email || !newPassword) {
      return c.json({ message: 'Email and new password are required.' }, 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ message: 'User not found.' }, 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      `UPDATE Users SET password = ? WHERE email = ?`,
      [hashedPassword, email]
    );

    // Clear resetEmail from use
    return c.json({ message: 'Password reset successful.' }, 200);

  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getProfile = async (c: Context) => {
  try {
    const id = c.req.param('id');

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, full_name as fullname, email, sex, department, contact_number, profile_picture FROM Users WHERE id = ?`,
      [id]
    );

    if (!rows.length) return c.json({ message: 'User not found.' }, 404);

    return c.json({ user: rows[0] }, 200);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const updateProfile = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { fullname, sex, department, contact_number, profile_picture } = body;

    await pool.query(
      `UPDATE Users SET full_name = ?, sex = ?, department = ?, contact_number = ?, profile_picture = ? WHERE id = ?`,
      [fullname, sex, department, contact_number, profile_picture ?? null, id]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, full_name as fullname, email, sex, department, contact_number, profile_picture FROM Users WHERE id = ?`,
      [id]
    );

    return c.json({ user: rows[0] }, 200);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};
