# React Concepts Already Explained

These topics have been covered in previous sessions. Don't re-explain from scratch — reference briefly if needed, but assume the user understands the basics.

## Core React

- **JSX** — HTML-like syntax in JavaScript, expressions in `{}`, fragments `<>...</>`
- **Components** — function declarations for components, arrow functions for handlers
- **Props** — passed top-down, destructured in function params. "Props down, callbacks up" pattern
- **useState** — state + setter, must use setter (not mutation) to trigger re-render. Lazy initializer form `useState(() => ...)`
- **useEffect** — side effects after render. Empty `[]` = run once on mount (like Blazor's `OnInitializedAsync`). Dependency array controls when it re-runs
- **useRef** — holds a DOM reference without triggering re-renders. Like Blazor's `@ref`
- **useContext / createContext** — shared state without prop drilling. Like Blazor's `CascadingValue`/`CascadingParameter`
- **Conditional rendering** — `&&` operator, ternary expressions (like `@if` in Blazor)
- **Lists and keys** — `.map()` for rendering lists (like `@foreach`), `key` prop for identity
- **Controlled components** — parent owns state via props + callbacks (e.g., `open` + `onOpenChange`)
- **Immutable state updates** — spread operator `{ ...prev, [field]: value }` to create new objects, never mutate directly
- **Event handling** — `onClick`, `onChange`, `onSubmit`. `e.preventDefault()` to stop default browser behavior

## Hooks & Patterns

- **Custom hooks** — extract reusable logic (e.g., `useTheme`). Must start with `use`
- **Lazy initializer** — `useState(() => localStorage.getItem(...))` runs only once, not every render
- **Async in useEffect** — can't make effect async directly. Use `.then()` chains or call async function inside. React Compiler's `set-state-in-effect` rule: don't call setState synchronously in effect body

## TanStack Table

- **Headless UI** — provides logic (sorting, filtering, pagination) but no HTML
- **Column definitions** — separate config (`accessorKey`, `header`, `cell`) from table rendering
- **`useReactTable`** — hook that creates a table instance from data + columns
- **`getCoreRowModel()`** — minimum required plugin. Others are opt-in: `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
- **`flexRender`** — bridge between TanStack Table's headless logic and React elements
- **`row.original`** — the raw data object for a row
- **`enableSorting: false`** — disables sorting on specific columns
- **Custom `filterFn`** — for columns where raw data differs from display (e.g., status number → label text)
- **Generics `<TData, TValue>`** — make `ApplicationTable` reusable for any data type

## shadcn/ui & Tailwind

- **shadcn/ui** — not a dependency, generates component source code into `src/components/ui/`. Install via `npx shadcn@latest add <component>`
- **Radix UI** — the underlying headless primitives shadcn wraps
- **Tailwind utility classes** — `flex`, `gap-*`, `mb-*`, `text-*`, `border-*`, theme variables like `text-destructive`, `bg-background`
- **`file:` modifier** — targets the file input button. `file:hover:` scopes hover to just the button
- **`dark:` modifier** — styles that apply when `dark` class is on `<html>`
- **`cn()` helper** — merges Tailwind classes with conflict resolution (from `src/lib/utils.ts`)
- **Lucide React** — icon library. Import icons as components: `<ExternalLink className="h-4 w-4" />`
- **Sonner** — toast library. `toast.error()`, `toast.success()`. `<Toaster />` provider renders as a portal

## React Ecosystem

- **React Router** — `createBrowserRouter`, `<Outlet />` for nested layouts, `<NavLink>` for active styling
- **Vite** — dev server, HMR, API proxy via `vite.config.ts`. Static files served from `public/`
- **TypeScript strict mode** — no `any`, `keyof` for type-safe field access, generics for reusable components
- **ESLint `react-refresh/only-export-components`** — files must export ONLY components or ONLY non-components. Move hooks/contexts to separate files

## Testing

- **Vitest** — test runner, `describe`/`it`/`expect`, `vi.fn()` for mocks, `vi.mock()` for module mocks
- **React Testing Library** — `render`, `screen.getByText`, `screen.getByRole`, `screen.getAllByRole`, `waitFor` for async
- **`getByRole` with `name`** — matches accessible name (text content or `aria-label`). Icon-only elements need `aria-label`
- **MSW** — mock API at the network level (installed but not heavily used yet)
- **`vi.mocked()`** — type-safe access to mocked functions for controlling return values per test
- **Context mocking in tests** — wrap components with `AuthContext.Provider` to inject fake auth state. More targeted than mocking the module
- **`createMemoryRouter`** — in-memory router for tests. `initialEntries` sets the starting URL. `router.state.location.pathname` asserts navigation happened
- **`userEvent`** — `@testing-library/user-event` simulates real user interactions (typing, clicking). `userEvent.setup()` creates an instance, then `user.type()`, `user.click()`

## Authentication Pattern

- **In-memory access token** — stored in a module-level variable (`client.ts`), not localStorage. XSS-safe but lost on page refresh
- **localStorage refresh token** — longer-lived token persisted for session restore. Trade-off: accessible to XSS, but needed without httpOnly cookie support
- **Silent session restore** — on mount, `AuthProvider` checks for stored refresh token and exchanges it for a new access token
- **Auto-refresh** — `scheduleRefresh` sets a `setTimeout` at 80% of token TTL. Self-resetting via ref (not `setInterval`) because each refresh returns a new token (rotation)
- **`useRef` for recursive functions** — `scheduleRefreshRef` avoids React Compiler's "accessed before declared" error. The ref holds the function, and the recursive `setTimeout` reads `ref.current`
- **`authFetch()` wrapper** — centralizes `Authorization: Bearer` header attachment. Drop-in replacement for `fetch()`
- **`ProtectedRoute` layout route** — pathless route in router config that acts as middleware. Checks auth state, shows loading during session restore, redirects to `/login` if unauthenticated
- **`<Navigate>` component** — React Router's declarative redirect. `replace` prop prevents back-button to protected page
- **Provider placement** — `AuthProvider` wraps `RouterProvider` in `main.tsx` so auth state is available to all routes (including public `/login` and `/register`)
