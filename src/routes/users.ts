import { Router } from 'express';
import * as usersController from '../controllers/usersController';
import { requireAuth, requireRole } from '../middleware/authorization';
import { UserRole } from '../types/index';

const usersRouter = Router();

// All routes require authentication
usersRouter.use(requireAuth);

// List users (admin/agent only)
usersRouter.get('/', requireRole(UserRole.ADMIN, UserRole.AGENT), usersController.listUsers);

// Get user profile
usersRouter.get('/:id', usersController.getUser);

// Update user
usersRouter.patch('/:id', usersController.updateUser);

export default usersRouter;
