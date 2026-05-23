import { Router } from 'express';
import {
  applyForLoan,
  myLoans,
  quoteLoan,
} from '../controllers/loanController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(requireAuth, requireRole('borrower'));
router.get('/quote', quoteLoan);
router.get('/mine', myLoans);
router.post('/', applyForLoan);
export default router;
