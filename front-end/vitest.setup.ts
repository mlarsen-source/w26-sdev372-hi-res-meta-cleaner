import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock URL methods not available in jsdom
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
