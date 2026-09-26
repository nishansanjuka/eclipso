import { UserJSON, UserWebhookEvent } from '@clerk/express';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../users/infrastructure/user.service';
import { AccessService } from './access.service';

@Injectable()
export class ClerkWebhookService {
  constructor(
    private readonly userService: UserService,
    private readonly access: AccessService,
  ) {}

  async handleUserCreated(event: UserWebhookEvent) {
    const userData = event.data as UserJSON;

    await this.userService.createUser({
      clerkId: userData.id,
      name: userData.first_name + ' ' + userData.last_name,
    });
  }

  async handleUserDeleted(event: UserWebhookEvent) {
    const { id } = event.data as { id?: string };
    if (!id) return;

    // Memberships cascade with the user row; drop any cached access too.
    await this.userService.deleteUser(id);
    this.access.invalidateUser(id);
  }
}
