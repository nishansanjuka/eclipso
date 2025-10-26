import z from 'zod';

export function validateFields(
  zscore: z.ZodCoercedString<unknown>,
  value: string,
): string {
  const result = zscore.safeParse(value);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => issue.message)
      .join(', ');
    throw new Error(errorMessages);
  }

  return result.data;
}
