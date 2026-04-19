import type { Context } from 'hono';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/user.model.js';

export const loginUser = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ message: 'Please fill in all fields.' }, 400);
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ message: 'Invalid email or password.' }, 401);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ message: 'Invalid email or password.' }, 401);
    }

    // Return user info (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      message: 'Login successful.',
      user: userWithoutPassword
    }, 200);

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};