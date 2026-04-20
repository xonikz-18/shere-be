import type { Context } from 'hono';
import {
  createBorrowRequest,
  getBorrowRequestById,
  getRequestsByBorrower,
  getIncomingRequestsByOwner,
  updateRequestStatus,
  getNotificationsForUser,
  getBorrowedItemsForUser,
  getLentItemsForUser
} from '../models/borrow-request.model.js';

export const requestBorrow = async (c: Context) => {
  try {
    const body = await c.req.json();
    const postId = body.post_id ?? body.postId;
    const borrowerId = body.borrower_id ?? body.borrowerId;

    if (!postId || !borrowerId) {
      return c.json({ message: 'Missing required fields.' }, 400);
    }

    const result = await createBorrowRequest(postId, borrowerId);
    const request = await getBorrowRequestById(result.insertId);

    return c.json({
      message: 'Borrow request sent.',
      request: {
        id: request?.id,
        postId: request?.post_id,
        postName: request?.post_name,
        ownerId: request?.owner_id,
        ownerName: request?.owner_name,
        borrowerId: request?.borrower_id,
        borrowerName: request?.borrower_name,
        status: request?.status,
        requestedAt: request?.created_at,
        updatedAt: request?.updated_at ?? request?.created_at
      },
      post: { id: postId, status: 'pending' }
    }, 201);
  } catch (error) {
    console.error('Request borrow error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getMyRequests = async (c: Context) => {
  try {
    const borrowerId = c.req.query('borrowerId') ?? c.req.query('borrower_id');
    if (!borrowerId) return c.json({ requests: [] }, 200);

    const rows = await getRequestsByBorrower(Number(borrowerId));

    const formatted = rows.map(r => ({
      id: r.id,
      postId: r.post_id,
      postName: r.post_name,
      ownerId: r.owner_id,
      ownerName: r.owner_name,
      borrowerId: r.borrower_id,
      status: r.status,
      requestedAt: r.created_at,
      updatedAt: r.updated_at ?? r.created_at
    }));

    return c.json({ requests: formatted }, 200);
  } catch (error) {
    console.error('Get my requests error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getIncomingRequests = async (c: Context) => {
  try {
    const ownerId = c.req.query('ownerId') ?? c.req.query('owner_id');
    if (!ownerId) return c.json({ requests: [] }, 200);

    const requests = await getIncomingRequestsByOwner(Number(ownerId));

    const formatted = requests.map(r => ({
      id: r.id,
      postId: r.post_id,
      postName: r.post_name,
      ownerId: Number(ownerId),
      borrowerId: r.borrower_id,
      borrowerName: r.borrower_name,
      borrowerProfilePicture: r.borrower_profile_picture ?? '',
      status: r.status,
      requestedAt: r.created_at,
      updatedAt: r.updated_at ?? r.created_at
    }));

    return c.json({ requests: formatted }, 200);
  } catch (error) {
    console.error('Get incoming requests error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};


export const approveRequest = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    await updateRequestStatus(id, 'approved');
    const request = await getBorrowRequestById(id);

    return c.json({
      message: 'Request approved.',
      post: { id: request?.post_id, status: 'borrowed' }
    }, 200);
  } catch (error) {
    console.error('Approve request error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const declineRequest = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    await updateRequestStatus(id, 'declined');
    const request = await getBorrowRequestById(id);

    return c.json({
      message: 'Request declined.',
      post: { id: request?.post_id, status: 'available' }
    }, 200);
  } catch (error) {
    console.error('Decline request error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getUserNotifications = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    if (!userId) return c.json({ notifications: [] }, 200);

    const rows = await getNotificationsForUser(Number(userId));

    const formatted = rows.map(r => ({
      id: r.id,
      requestId: r.id,
      postId: r.post_id,
      type: r.status === 'approved' ? 'request-approved' : 'request-declined',
      status: r.status,
      itemName: r.post_name,
      actorName: r.owner_name,
      actorProfilePicture: r.owner_profile_picture ?? '',
      message: r.status === 'approved'
        ? `${r.owner_name} approved your request for "${r.post_name}".`
        : `${r.owner_name} declined your request for "${r.post_name}".`,
      createdAt: r.updated_at ?? r.created_at
    }));

    return c.json({ notifications: formatted }, 200);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getBorrowedItems = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    if (!userId) return c.json({ items: [] }, 200);

    const rows = await getBorrowedItemsForUser(Number(userId));

    const items = rows.map(r => ({
      requestId: r.request_id,
      postId: r.post_id,
      name: r.name,
      image: r.image ?? '',
      owner: r.owner ?? 'Unknown',
      requestedAt: r.requested_at,
      approvedAt: r.approved_at,
      status: 'borrowed'
    }));

    return c.json({ items }, 200);
  } catch (error) {
    console.error('Get borrowed items error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};

export const getLentItems = async (c: Context) => {
  try {
    const userId = c.req.query('userId') ?? c.req.query('user_id');
    if (!userId) return c.json({ items: [] }, 200);

    const rows = await getLentItemsForUser(Number(userId));

    const items = rows.map(r => ({
      requestId: r.request_id,
      postId: r.post_id,
      name: r.name,
      image: r.image ?? '',
      borrower: r.borrower ?? 'Unknown',
      requestedAt: r.requested_at,
      approvedAt: r.approved_at,
      status: 'lent'
    }));

    return c.json({ items }, 200);
  } catch (error) {
    console.error('Get lent items error:', error);
    return c.json({ message: 'Internal server error.' }, 500);
  }
};