import '@testing-library/jest-dom';

// JSDOM doesn't implement matchMedia — required by shadcn sidebar's useIsMobile hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// JSDOM doesn't implement ResizeObserver — required by Radix UI's Checkbox (react-use-size)
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
