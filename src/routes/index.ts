import { Router } from 'express';
import auth from './auth';
import profile from './profile';
import loans from './loans';
import dashboard from './dashboard';

const router = Router();
router.use('/auth', auth);
router.use('/profile', profile);
router.use('/loans', loans);
router.use('/dashboard', dashboard);
export default router;
