import { Hono } from 'hono';
import { loginUser } from '../controllers/login.controller.js';

const loginRoute = new Hono();

loginRoute.post('/login', loginUser);

export default loginRoute;