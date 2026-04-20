import { Hono } from 'hono';
import { addPost, editPost, getPosts, removePost } from '../controllers/post.controller.js';

const postRoute = new Hono();

postRoute.get('/posts', getPosts);
postRoute.post('/posts', addPost);
postRoute.get('/posts/all', getPosts);
postRoute.put('/posts/:id', editPost);     
postRoute.delete('/posts/:id', removePost);

export default postRoute;