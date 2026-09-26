import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../../shared/utils/pg-errors';
import { AuthContext } from '../../auth/domain/auth-context';
import { AccessService } from '../../auth/infrastructure/access.service';
import { CreateBranchInput, UpdateBranchInput } from '../dto/branch.dto';
import { BranchRepository } from '../infrastructure/branch.repository';

const CODE_TAKEN = 'A branch with this code already exists.';

@Injectable()
export class BranchUseCase {
  constructor(
    private readonly repository: BranchRepository,
    private readonly access: AccessService,
  ) {}

  /** A restricted member only sees the branches they may work in. */
  list(actor: AuthContext) {
    return this.repository.list(actor.businessId!, actor.restrictedBranchIds);
  }

  async create(actor: AuthContext, input: CreateBranchInput) {
    // A restricted manager could not use a branch they create.
    if (actor.branchRestricted) {
      throw new ForbiddenException(
        'You are limited to specific branches and cannot create new ones.',
      );
    }
    const businessId = actor.businessId!;

    try {
      const branch = await this.repository.withBusinessLock(businessId, (tx) =>
        this.repository.insert(tx, {
          businessId,
          name: input.name,
          code: input.code,
          address: input.address ?? null,
          kind: input.kind,
          // A warehouse holds stock only: no tills.
          registerCount:
            input.kind === 'warehouse' ? 0 : (input.registerCount ?? 1),
        }),
      );
      this.access.invalidateBusiness(actor.orgId!);
      return branch;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(CODE_TAKEN);
      throw error;
    }
  }

  async update(actor: AuthContext, id: string, patch: UpdateBranchInput) {
    const businessId = actor.businessId!;

    const touchesStructure =
      patch.code !== undefined ||
      patch.isActive !== undefined ||
      patch.isDefault !== undefined;
    if (touchesStructure && actor.branchRestricted) {
      throw new ForbiddenException(
        'You are limited to specific branches and can only rename them.',
      );
    }
    if (patch.isDefault === false) {
      throw new BadRequestException(
        'Make another branch the default instead of unsetting this one.',
      );
    }

    try {
      const updated = await this.repository.withBusinessLock(
        businessId,
        async (tx) => {
          const branch = await this.repository.findById(tx, businessId, id);
          // Same answer for "missing" and "not yours".
          if (!branch || !actor.canAccessBranch(branch.id)) {
            throw new NotFoundException('Branch not found.');
          }

          const active = patch.isActive ?? branch.isActive;
          if (branch.isDefault && !active) {
            throw new BadRequestException(
              'The default branch cannot be deactivated. Make another branch the default first.',
            );
          }
          if (patch.isDefault === true) {
            if (!active) {
              throw new BadRequestException(
                'An inactive branch cannot be the default.',
              );
            }
            await this.repository.clearDefault(tx, businessId);
          }

          return this.repository.update(tx, id, {
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.code !== undefined && { code: patch.code }),
            ...(patch.address !== undefined && {
              address: patch.address ?? null,
            }),
            ...(patch.registerCount !== undefined && {
              registerCount:
                branch.kind === 'warehouse' ? 0 : patch.registerCount,
            }),
            ...(patch.isActive !== undefined && { isActive: patch.isActive }),
            ...(patch.isDefault === true && { isDefault: true }),
          });
        },
      );
      // Which branches a member can operate in has changed.
      this.access.invalidateBusiness(actor.orgId!);
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(CODE_TAKEN);
      throw error;
    }
  }
}
