import 'reflect-metadata';
import { z } from 'zod';
import { SchemaMap, ZOD_META_KEY } from '../decorators/zod.validation';

type Shape = SchemaMap;
type ParsedShape<T extends Shape> = z.infer<z.ZodObject<T>>;

export abstract class BaseModel<TShape extends Shape = Shape> {
  protected constructor(data: unknown) {
    const schema = this.getZodSchema();
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw new Error(errorMessages);
    }

    this.applyParsedValues(result.data);
  }

  private applyParsedValues(parsed: ParsedShape<TShape>): void {
    for (const key of Object.keys(parsed) as Array<keyof ParsedShape<TShape>>) {
      (this as ParsedShape<TShape>)[key] = parsed[key];
    }
  }

  private getZodSchema(): z.ZodObject<TShape> {
    const prototype = Object.getPrototypeOf(this) as object;
    const rules = Reflect.getMetadata(ZOD_META_KEY, prototype) as
      | TShape
      | undefined;
    if (!rules) {
      throw new Error(
        '❌ No Zod schema metadata found. Did you forget to add @Z decorators?',
      );
    }
    return z.object(rules);
  }
}
