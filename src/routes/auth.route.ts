import { Hono } from 'hono';
import { forgotPassword, getProfile, resetPassword, updateProfile } from '../controllers/auth.controller.js';
import { registerUser } from '../controllers/register.controller.js';


const authRoute = new Hono();

authRoute.post('/register', registerUser);
authRoute.post('/forgot-password', forgotPassword);
authRoute.post('/reset-password', resetPassword); 
authRoute.get('/profile/:id', getProfile);
authRoute.put('/profile/:id', updateProfile);

export default authRoute;