import { Router } from 'express';
import {
  getMyProfile,
  upsertProfile,
  uploadSalarySlip,
} from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { upload } from '../middleware/upload';

const router = Router();
router.use(requireAuth, requireRole('borrower'));
router.get('/me', getMyProfile);
router.put('/me', upsertProfile);
router.post('/me/salary-slip', upload.single('file'), uploadSalarySlip);
export default router;
