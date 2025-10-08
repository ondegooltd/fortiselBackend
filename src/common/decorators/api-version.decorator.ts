import { SetMetadata } from '@nestjs/common';

export const API_VERSION_KEY = 'api_version';

/**
 * Decorator to specify the API version for a controller or method
 * @param version API version (e.g., 'v1', 'v2')
 */
export const ApiVersion = (version: string) =>
  SetMetadata(API_VERSION_KEY, version);

/**
 * Decorator to mark a method as deprecated
 * @param deprecatedVersion Version when the method was deprecated
 * @param removalVersion Version when the method will be removed
 */
export const Deprecated = (
  deprecatedVersion: string,
  removalVersion?: string,
) =>
  SetMetadata(API_VERSION_KEY, {
    deprecated: true,
    deprecatedVersion,
    removalVersion,
  });

/**
 * Decorator to mark a method as experimental
 * @param version Version when the method was introduced
 */
export const Experimental = (version: string) =>
  SetMetadata(API_VERSION_KEY, {
    experimental: true,
    version,
  });
