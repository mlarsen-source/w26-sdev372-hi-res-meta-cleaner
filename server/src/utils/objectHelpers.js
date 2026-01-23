/**
 * Removes properties with undefined or empty string values from an object.
 * Returns a new object without mutating the original.
 * @param {Object} obj - The object to clean
 * @returns {Object} New object with empty fields removed
 */
export function removeEmptyFields(obj) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== "") {
      result[key] = value;
    }
  }

  return result;
}
