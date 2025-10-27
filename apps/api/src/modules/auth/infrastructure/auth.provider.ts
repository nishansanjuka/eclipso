import { createClerkClient } from '@clerk/express';
import authConfig from '../auth.config';

export const ClerkClientProvider = {
  provide: 'CLERK_CLIENT',
  useFactory: () => {
    return createClerkClient({
      secretKey: authConfig().secret_key,
      publishableKey: authConfig().publishable_key,
    });
  },
};
