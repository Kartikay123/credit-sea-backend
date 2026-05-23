import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  salesLeads,
  sanctionList,
  sanctionApprove,
  sanctionReject,
  disbursementList,
  disburse,
  collectionList,
  loanPayments,
} from '../controllers/dashboardController';
import { recordPayment } from '../controllers/paymentController';

const router = Router();
router.use(requireAuth);

router.get('/sales/leads', requireRole('sales'), salesLeads);

router.get('/sanction/loans', requireRole('sanction'), sanctionList);
router.post(
  '/sanction/loans/:id/approve',
  requireRole('sanction'),
  sanctionApprove
);
router.post(
  '/sanction/loans/:id/reject',
  requireRole('sanction'),
  sanctionReject
);

router.get(
  '/disbursement/loans',
  requireRole('disbursement'),
  disbursementList
);
router.post(
  '/disbursement/loans/:id/disburse',
  requireRole('disbursement'),
  disburse
);

router.get('/collection/loans', requireRole('collection'), collectionList);
router.get(
  '/collection/loans/:id/payments',
  requireRole('collection'),
  loanPayments
);
router.post(
  '/collection/loans/:loanId/payments',
  requireRole('collection'),
  recordPayment
);

export default router;
