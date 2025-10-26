import z from 'zod';

export const validatedEmail = z.coerce
  .string()
  .trim()
  .min(1, 'Email is required')
  .refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Invalid email address',
  );
