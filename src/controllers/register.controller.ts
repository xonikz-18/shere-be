import type { Context } from 'hono';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../models/user.model.js';

const VALID_DEPARTMENTS = [
  'College of Arts and Sciences',
  'School of Business, Management and Accountancy',
  'College of Criminal Justice',
  'College of Engineering',
  'College of Information Technology',
  'College of Medical Laboratory Science',
  'Conservatory of Music, Theater and Dance',
  'College of Nursing',
  'College of Dentistry',
  'College of Pharmacy',
  'College of Rehabilitation Sciences',
  'College of Radiologic Technology',
  'School of Teacher Education',
];

export const registerUser = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { fullname, email, sex, department, contact_number, password } = body;

    // Validate required fields
    if (!fullname || !email || !sex || !department || !contact_number || !password) {
      return c.json({ message: 'Please fill in all required fields.' }, 400);
    }

    // Validate sex
    if (!['Male', 'Female'].includes(sex)) {
      return c.json({ message: 'Invalid gender value.' }, 400);
    }

    // Validate department
    if (!VALID_DEPARTMENTS.includes(department)) {
      return c.json({ message: 'Invalid department selected.' }, 400);
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return c.json({ message: 'Email is already registered.' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await createUser({
      fullname,
      email,
      sex,
      department,
      contact_number,
      password: hashedPassword,
    });

    return c.json({ message: 'Registration successful.' }, 201);

  } catch (error) {
    console.error('Register error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};