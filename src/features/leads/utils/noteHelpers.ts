/**
 * Note helper utilities
 * Shared functions for note processing
 */

/**
 * Parse note metadata from API response
 * Handles both JSON string and object formats
 */
export function parseNoteMetadata(metadata: string | object | undefined): any {
  if (!metadata) {
    return undefined;
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[parseNoteMetadata] Failed to parse:', metadata, e);
      }
      return undefined;
    }
  }

  return metadata;
}
