import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { isValidSlug } from '../../../shared/utils/slug';
import { BusinessService } from '../infrastructure/business.service';

/**
 * Public: does a workspace address belong to a business? The web app asks this
 * before serving `<slug>.<root domain>`, so an address nobody owns can be sent
 * to the base domain instead of an empty shell. Only existence is revealed, and
 * the address is already visible to anyone who can see the DNS name.
 */
@Controller('public/workspaces')
export class PublicWorkspaceController {
  constructor(private readonly businesses: BusinessService) {}

  @ApiOperation({
    operationId: 'workspaceExists',
    description: 'Public. Whether a workspace address is in use.',
  })
  @ApiParam({ name: 'slug', type: String })
  @Get(':slug/exists')
  async exists(@Param('slug') slug: string) {
    const normalized = slug.trim().toLowerCase();
    // Malformed or reserved addresses can never be a workspace.
    if (!isValidSlug(normalized)) return { exists: false };
    return { exists: await this.businesses.slugTaken(normalized) };
  }
}
