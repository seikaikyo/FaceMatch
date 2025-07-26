import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { loginSchema, updateProfileSchema, changePasswordSchema } from '../../utils/validation';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), AuthController.updateProfile);
router.put('/change-password', authenticateToken, validateBody(changePasswordSchema), AuthController.changePassword);

export default router;