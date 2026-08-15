import { z } from 'zod';

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),

    email: z
      .string()
      .trim()
      .email('Enter a valid email address'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),

    role: z.enum(['teacher', 'student'], {
      message: 'Please select your role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;