import { Hono } from 'hono';
import { registerUser } from '../controllers/register.controller.js';

const registerRoute = new Hono();

registerRoute.post('/register', registerUser);

export default registerRoute;