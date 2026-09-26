import { BadRequestException } from '@nestjs/common';

/**
 * Returns the branch the request operates in, or asks the caller to pick one.
 * Stock-affecting endpoints need a branch; a business with a single (default)
 * branch never sees this error because that branch is picked automatically.
 */
export function requireBranchId(user: { branchId?: string }): string {
  if (!user.branchId) {
    throw new BadRequestException(
      'This action needs a branch. Send the X-Branch-Id header.',
    );
  }
  return user.branchId;
}
