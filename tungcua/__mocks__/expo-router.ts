import { jest } from '@jest/globals';
import { useEffect } from 'react';

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};

let params: Record<string, string> = {};

export function __setMockParams(next: Record<string, string>): void {
  params = next;
}

export function __resetMockRouter(): void {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.navigate.mockClear();
  params = {};
}

export const useRouter = () => mockRouter;

export const useLocalSearchParams = () => params;

export const useFocusEffect = (callback: () => void) => {
  useEffect(callback, [callback]);
};

export const Link = ({ children }: { children?: unknown }) => children ?? null;

export const Stack = Object.assign(() => null, { Screen: () => null });

export const Tabs = Object.assign(() => null, { Screen: () => null });
