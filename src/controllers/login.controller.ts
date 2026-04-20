import type { Context } from 'hono';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/user.model.js';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] || 'liceo-sharesphere-jwt-secret-2026'
);

export const loginUser = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ message: 'Please fill in all fields.' }, 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ message: 'Invalid email or password.' }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ message: 'Invalid email or password.' }, 401);
    }

    // Generate JWT
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: (user as any).role ?? 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      message: 'Login successful.',
      token,
      user: {
        ...userWithoutPassword,
        fullname: userWithoutPassword.fullname,
        role: (user as any).role ?? 'user'
      }
    }, 200);

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};