import UserModel from '../models/users.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/utils.emailService.js';
import ENV_CONFIG from '../config/config.env.js';


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };
  

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (id) => {
  return jwt.sign({ id }, ENV_CONFIG.JWT_SECRET_KEY, {
    expiresIn: '30d'
  });
};

const authController = {
    signup: async (req, res) => {
        try {
          const { name, email, password, confirmPassword, phone } = req.body;
    
          if (!name || name.trim().length < 2) {
            return res.status(400).json({
              status: 'error',
              message: 'Name must be at least 2 characters long'
            });
          }
    
          if (!email || !validateEmail(email)) {
            return res.status(400).json({
              status: 'error',
              message: 'Please provide a valid email address'
            });
          }
    
          if (!validatePassword(password)) {
            return res.status(400).json({
              status: 'error',
              message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
          }
    
          if (password !== confirmPassword) {
            return res.status(400).json({
              status: 'error',
              message: 'Passwords do not match'
            });
          }
    
          if (!validatePhone(phone)) {
            return res.status(400).json({
              status: 'error',
              message: 'Please provide a valid phone number'
            });
          }
    
          const existingUser = await UserModel.findOne({
            $or: [{ email }, { phone }]
          });
    
          if (existingUser) {
            return res.status(400).json({
              status: 'error',
              message: existingUser.email === email ? 
                'Email already registered' : 
                'Phone number already registered'
            });
          }
    
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(password, salt);
    
          const otp = generateOTP();
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
          const user = await UserModel.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            otp: {
              code: otp,
              expiresAt: otpExpiry
            }
          });
    
          try {
            await sendEmail({
              email: user.email,
              subject: 'Email Verification OTP',
              message: `Hello ${user.name},\n\nYour OTP for email verification is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
            });
          } catch (emailError) {
            await UserModel.findByIdAndDelete(user._id);
            return res.status(500).json({
              status: 'error',
              message: 'Failed to send verification email. Please try again.'
            });
          }
    
          res.status(201).json({
            status: 'success',
            message: 'Registration successful! Please check your email for OTP verification.',
            data: {
              userId: user._id,
              token: generateToken(user._id)
            }
          });
    
        } catch (error) {
          console.error('Signup Error:', error);
          res.status(500).json({
            status: 'error',
            message: 'An error occurred during registration. Please try again.'
          });
        }
      },
    

  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email address'
        });
      }

      if (!otp || otp.length !== 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid 6-digit OTP'
        });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already verified'
        });
      }

      if (!user.otp || !user.otp.code) {
        return res.status(400).json({
          status: 'error',
          message: 'No OTP found. Please request a new OTP'
        });
      }

      if (user.otp.code !== otp) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid OTP'
        });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({
          status: 'error',
          message: 'OTP has expired. Please request a new one'
        });
      }

      user.isVerified = true;
      user.otp = undefined;
      await user.save();

      res.json({
        status: 'success',
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('OTP Verification Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred during verification. Please try again.'
      });
    }
  },

  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email address'
        });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already verified'
        });
      }

      if (user.otp && user.otp.expiresAt) {
        const timeDiff = new Date(user.otp.expiresAt) - new Date();
        if (timeDiff > 9 * 60 * 1000) { 
          return res.status(400).json({
            status: 'error',
            message: 'Please wait 1 minute before requesting a new OTP'
          });
        }
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = {
        code: otp,
        expiresAt: otpExpiry
      };
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'New Email Verification OTP',
        message: `Hello ${user.name},\n\nYour new OTP for email verification is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
      });

      res.json({
        status: 'success',
        message: 'New OTP sent successfully'
      });

    } catch (error) {
      console.error('Resend OTP Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while sending new OTP. Please try again.'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email address'
        });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid password'
        });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() })
        .select('+password');

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      if (!user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Please verify your email before logging in'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      res.json({
        status: 'success',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isVerified: user.isVerified
          },
          token: generateToken(user._id)
        }
      });

    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred during login. Please try again.'
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email address'
        });
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'No user found with this email address'
        });
      }

      if (!user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Please verify your email first'
        });
      }

      if (user.passwordResetExpires && new Date(user.passwordResetExpires) > new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Please wait 5 minutes before requesting another reset token'
        });
      }

      const resetToken = generateOTP();
      const resetExpiry = new Date(Date.now() + 30 * 60 * 1000); 

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpiry;
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message: `Hello ${user.name},\n\nYour password reset token is: ${resetToken}\n\nThis token will expire in 30 minutes.\n\nIf you didn't request this, please ignore this email and make sure your account is secure.`
      });

      res.json({
        status: 'success',
        message: 'Password reset token sent to your email'
      });

    } catch (error) {
      console.error('Forgot Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while processing your request. Please try again.'
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email address'
        });
      }

      if (!token || token.length !== 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid reset token'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long'
        });
      }

      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired reset token'
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Successful',
        message: `Hello ${user.name},\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact support immediately.`
      });

      res.json({
        status: 'success',
        message: 'Password reset successful. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while resetting your password. Please try again.'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide both current and new password'
        });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be different from current password'
        });
      }

      const user = await UserModel.findById(req.user._id).select('+password');
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'Password Changed Successfully',
        message: `Hello ${user.name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.`
      });

      res.json({
        status: 'success',
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while changing your password. Please try again.'
      });
    }
  },

  authStatus: async (req, res) => {
    res.json({
     ok: true,
     user : {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      isVerified: req.user.isVerified
     }
    });
  }
};

export default  authController;