import type { Context } from 'hono';
import { createPost, getAllPosts, getPostById } from '../models/post.model.js';

export const addPost = async (c: Context) => {
  try {
    const body = await c.req.json();

    // Angular sends both userId/user_id and itemName/item_name so handle both
    const user_id = body.user_id ?? body.userId;
    const item_name = body.item_name ?? body.itemName;
    const { description, attachment } = body;

    if (!user_id || !item_name || !description) {
      return c.json({ message: 'Please fill in all required fields.' }, 400);
    }

    const result = await createPost({ user_id, item_name, description, attachment });
    const newPost = await getPostById(result.insertId);

    return c.json({
      message: 'Post created successfully.',
      post: {
        id: newPost?.id,
        userId: newPost?.user_id,
        name: newPost?.item_name,
        description: newPost?.description,
        image: newPost?.attachment ?? '',
        owner: newPost?.owner_name ?? 'Unknown',
        date: new Date(newPost?.created_at).toLocaleDateString(),
        status: newPost?.status
      }
    }, 201);

  } catch (error) {
    console.error('Add post error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getPosts = async (c: Context) => {
  try {
    const posts = await getAllPosts();

    const formatted = posts.map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.item_name,
      description: p.description,
      image: p.attachment ?? '',
      owner: p.owner_name ?? 'Unknown',
      date: new Date(p.created_at).toLocaleDateString(),
      status: p.status
    }));

    return c.json({ posts: formatted }, 200);

  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};