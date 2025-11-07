/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { logDebug } from '@eclipso/utils';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';

export function CatchEntityErrors(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (err: any) {
        if (err instanceof DrizzleQueryError) {
          logDebug('DrizzleQueryError:', err);
          // Preserve original error in metadata for audit logging
          const transformedError = new BadRequestException(`${err.cause}`);
          (transformedError as any).originalError = err;
          (transformedError as any).errorType = 'DrizzleQueryError';
          throw transformedError;
        }
        if (err instanceof Error) {
          logDebug('Error:', err);

          if ('status' in err && err.status === 404) {
            throw new NotFoundException(err.message);
          } else {
            // Preserve original error in metadata
            const transformedError = new BadRequestException(err.message);
            (transformedError as any).originalError = err;
            throw transformedError;
          }
        }
        throw err;
      }
    };

    return descriptor;
  };
}
