import { isBuiltin } from 'node:module';

export async function resolve(specifier, context, defaultResolve) {
  if (isBuiltin(specifier)) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      for (const ext of ['.ts', '.tsx', '.js', '/index.ts', '/index.js']) {
        try {
          return await defaultResolve(specifier + ext, context, defaultResolve);
        } catch {
          // continue
        }
      }
    }
    throw err;
  }
}
