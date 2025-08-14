import * as yup from 'yup';

/**
 * Authentication validation schemas using Yup
 * Provides comprehensive validation for email/password authentication
 */

export const authValidationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
    
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

/**
 * Validation schema for login form (less strict password requirements for existing accounts)
 */
export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
    
  password: yup
    .string()
    .required('Password is required')
    .min(1, 'Password is required'), // Basic requirement for login
    
  rememberMe: yup
    .boolean()
    .optional()
    .default(false), // AUTH-019: Optional remember me field for persistent login
});

/**
 * Validation schema for password reset
 */
export const passwordResetValidationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
});

/**
 * Validation schema for new password (password reset confirmation)
 */
export const newPasswordValidationSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

export type AuthValidationValues = yup.InferType<typeof authValidationSchema>;
export type LoginValidationValues = yup.InferType<typeof loginValidationSchema>;
export type PasswordResetValidationValues = yup.InferType<typeof passwordResetValidationSchema>;
export type NewPasswordValidationValues = yup.InferType<typeof newPasswordValidationSchema>;