import { describe, it, expect } from 'vitest';
import { removeEmptyFields } from '../src/utils/objectHelpers.js';

describe('removeEmptyFields', () => {
  it('removes keys with undefined or empty string values', () => {
    // Arrange
    const input = { a: 'hello', b: undefined, c: '' };

    // Act
    const result = removeEmptyFields(input);

    // Assert
    expect(result).toEqual({ a: 'hello' });
  });

  it('keeps keys with valid values including 0, false, and null', () => {
    // Arrange
    const input = { a: 0, b: false, c: null, d: 'text' };

    // Act
    const result = removeEmptyFields(input);

    // Assert
    expect(result).toEqual({ a: 0, b: false, c: null, d: 'text' });
  });

  it('does not mutate the original object', () => {
    // Arrange
    const original = { a: 'hello', b: '' };

    // Act
    removeEmptyFields(original);

    // Assert
    expect(original).toEqual({ a: 'hello', b: '' });
  });
});
