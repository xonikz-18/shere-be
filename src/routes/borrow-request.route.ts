import { Hono } from 'hono';
import {
  requestBorrow,
  getMyRequests,
  getIncomingRequests,
  approveRequest,
  declineRequest,
  getUserNotifications,
  getBorrowedItems,
  getLentItems
} from '../controllers/borrow-request.controller.js';

const borrowRequestRoute = new Hono();

borrowRequestRoute.post('/borrow-requests', requestBorrow);
borrowRequestRoute.get('/borrow-requests/mine', getMyRequests);
borrowRequestRoute.get('/borrow-requests/incoming', getIncomingRequests);
borrowRequestRoute.get('/borrow-requests/notifications', getUserNotifications);
borrowRequestRoute.get('/borrow-requests/borrowed', getBorrowedItems);
borrowRequestRoute.get('/borrow-requests/lent', getLentItems);
borrowRequestRoute.patch('/borrow-requests/:id/approve', approveRequest);
borrowRequestRoute.patch('/borrow-requests/:id/decline', declineRequest);

export default borrowRequestRoute;