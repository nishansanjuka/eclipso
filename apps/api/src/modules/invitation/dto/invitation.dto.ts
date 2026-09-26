import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Enter a valid email address'));

export const createInvitationsSchema = z.object({
  invitations: z
    .array(
      z.object({
        email,
        roleId: z.uuid('roleId must be a UUID'),
        /** Empty / omitted = every branch. */
        branchIds: z
          .array(z.uuid('branchIds must be UUIDs'))
          .max(100)
          .transform((ids) => [...new Set(ids)])
          .optional(),
      }),
    )
    .min(1, 'Add at least one invitation')
    .max(25, 'Send at most 25 invitations at a time'),
});

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{43}$/, 'Invalid invitation link'),
});

export class InvitationItemDto {
  @ApiProperty({ example: 'ishara@example.com' })
  email: string;
  @ApiProperty({ format: 'uuid' })
  roleId: string;
  @ApiPropertyOptional({
    type: [String],
    description: 'Limit to these branches. Empty = every branch.',
  })
  branchIds?: string[];
}

export class CreateInvitationsDto {
  @ApiProperty({ type: [InvitationItemDto] })
  invitations: InvitationItemDto[];
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'The token from the invitation link' })
  token: string;
}
