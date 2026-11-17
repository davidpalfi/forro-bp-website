// Lets plain Node load the Studio's schema files, whose imports leave out the ".ts" ending.
// Used by scripts/check-schema.mjs:  node --import ./scripts/lib/ts-resolve.mjs ...
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !/\\.[a-z]+$/i.test(specifier)) return next(specifier + '.ts', context);
    throw error;
  }
}`),
);
