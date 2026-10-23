import * as expoRouter from 'expo-router';
import type * as MockedExpoRouter from '../../../__mocks__/expo-router';

/**
 * Typed access to the manual `expo-router` mock. The manual mock is applied
 * automatically by Jest; TypeScript still sees the real module, so cast once
 * here instead of in every test.
 */
const mocked = expoRouter as unknown as typeof MockedExpoRouter;

export const mockRouter = mocked.mockRouter;
export const __resetMockRouter = mocked.__resetMockRouter;
export const __setMockParams = mocked.__setMockParams;
