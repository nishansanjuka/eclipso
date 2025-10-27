import 'reflect-metadata';
import { z } from 'zod';

export const ZOD_META_KEY = 'zod:schema';

export type SchemaMap = Record<string, z.ZodTypeAny>;

export function Z(schema: z.ZodTypeAny): PropertyDecorator {
  return function defineZodProperty(target: object, key: PropertyKey): void {
    const existingSchemas =
      (Reflect.getMetadata(ZOD_META_KEY, target) as SchemaMap | undefined) ??
      {};
    const propertyKey = String(key);
    const nextSchemas: SchemaMap = {
      ...existingSchemas,
      [propertyKey]: schema,
    };
    Reflect.defineMetadata(ZOD_META_KEY, nextSchemas, target);
  };
}
