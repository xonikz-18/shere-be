import { Hono } from 'hono';
import { addPost, getPosts } from '../controllers/post.controller.js';

const postRoute = new Hono();

postRoute.get('/posts', getPosts);
postRoute.post('/posts', addPost);

export default postRoute;