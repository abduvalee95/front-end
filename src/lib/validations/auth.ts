import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, 'Must be a valid Uzbekistan phone number (+998 followed by 9 digits)');

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or Phone is required')
    .refine((val) => {
      // Check if it's a valid email or a valid +998 phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isPhone = /^\+998\d{9}$/.test(val);
      return isEmail || isPhone;
    }, 'Must be a valid email or Uzbekistan phone number (+998)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
