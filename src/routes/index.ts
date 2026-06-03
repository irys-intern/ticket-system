import { Router } from 'express';
import authRouter from './auth';
import ticketsRouter from './tickets';
import usersRouter from './users';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tickets', ticketsRouter);
apiRouter.use('/users', usersRouter);

export default apiRouter;
