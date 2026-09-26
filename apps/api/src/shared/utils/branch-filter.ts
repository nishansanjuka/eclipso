import { type AnyColumn, inArray, type SQL, sql } from 'drizzle-orm';
import { type BranchScope } from '../../modules/auth/domain/auth-context';

/**
 * WHERE condition that limits rows to the branches the caller may see.
 * `undefined` (no condition) for callers who can work in every branch, which
 * drizzle's `and()` ignores. A restricted caller with no branches matches
 * nothing rather than everything.
 */
export function branchScopeCondition(
  column: AnyColumn,
  scope: Pick<BranchScope, 'restrictedBranchIds'>,
): SQL | undefined {
  const ids = scope.restrictedBranchIds;
  if (ids === null) return undefined;
  return ids.length > 0 ? inArray(column, [...ids]) : sql`false`;
}
