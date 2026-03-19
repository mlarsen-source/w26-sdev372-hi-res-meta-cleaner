import { describe, it, expect } from "vitest";
import { formatFileSize } from "../src/utils/formatters.js";

describe("formatFileSize", () => {
  it("formats bytes under 1024 as B", () => {
    // Act / Assert
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes correctly", () => {
    // Act / Assert
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });
  it("formats megabytes correctly", () => {
    // Act / Assert
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });
});
