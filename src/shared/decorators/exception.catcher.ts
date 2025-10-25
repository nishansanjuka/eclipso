/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
          console.log(err);
          throw new BadRequestException(`${err.cause}`);
        }
        if (err instanceof Error) {
          console.log(err);

          if ('status' in err && err.status === 404) {
            throw new NotFoundException(err.message);
          } else {
            throw new BadRequestException(err.message);
          }
        }
        throw err;
      }
    };

    return descriptor;
  };
}
