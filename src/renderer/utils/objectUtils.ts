// src/utils/objectUtils.ts

/**
 * Recursively converts all snake_case keys in an object/array to camelCase.
 * Works with nested objects and arrays.
 */
export const toCamelCase = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        newObj[camelKey] = toCamelCase((obj as any)[key]);
      }
    }
    return newObj;
  }

  return obj;
};