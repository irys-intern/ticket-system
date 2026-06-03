import { Router } from 'express';
import authRouter from './auth.ts';
import ticketsRouter from './tickets.ts';
import usersRouter from './users.ts';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tickets', ticketsRouter);
apiRouter.use('/users', usersRouter);

export default apiRouter;
