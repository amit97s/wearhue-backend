import express from 'express';
import authController from "../controllers/auth.js";
import authMiddleware  from "../middleware/auth.js";

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authMiddleware.protect, authController.changePassword);
router.post('/session', authMiddleware.protect, authController.authStatus);

export default router;