/*
The foundation of demo mode. Stores
application data in sessionStorage so it survives page
refresh but clears when the browser closes. Also seeds 6
realistic sample records on first entry.*/
import type {components} from '@/types/api';

type ApplicationRecord =
  components['schemas']['ApplicationRecordDto'];

const DEMO_APPLICATIONS_KEY = 'demo_applications';
const DEMO_MODE_KEY = 'demo_mode';

let nextId = 1000;

// Seed data
const SAMPLE_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 1,
    companyName: 'Google',
    status: 0,
    appliedDate: '2025-01-10T00:00:00Z',
    postingUrl: 'https://careers.google.com',
    notes: 'Applied via referral. Heard back within a week.',
    createdAt: '2025-01-10T09:00:00Z',
    lastModified: '2025-01-10T09:00:00Z',
  },
  {
    id: 2,
    companyName: 'Microsoft',
    status: 1,
    appliedDate: '2025-01-15T00:00:00Z',
    postingUrl: 'https://careers.microsoft.com',
    notes: 'Phone screen scheduled for next Tuesday.',
    createdAt: '2025-01-15T10:00:00Z',
    lastModified: '2025-01-20T14:00:00Z',
  },
  {
    id: 3,
    companyName: 'Spotify',
    status: 2,
    appliedDate: '2025-01-05T00:00:00Z',
    postingUrl: 'https://www.lifeatspotify.com',
    notes: 'Two rounds done. Final interview next week.',
    createdAt: '2025-01-05T08:00:00Z',
    lastModified: '2025-01-22T11:00:00Z',
  },
  {
    id: 4,
    companyName: 'Netflix',
    status: 3,
    appliedDate: '2024-12-20T00:00:00Z',
    postingUrl: null,
    notes: 'Rejected after technical screen. Will try again in 6 months.',
    createdAt: '2024-12-20T09:00:00Z',
    lastModified: '2025-01-08T16:00:00Z',
  },
  {
    id: 5,
    companyName: 'Apple',
    status: 4,
    appliedDate: '2024-12-15T00:00:00Z',
    postingUrl: 'https://jobs.apple.com',
    notes: 'Withdrew after accepting another offer.',
    createdAt: '2024-12-15T10:00:00Z',
    lastModified: '2025-01-25T09:00:00Z',
  },
  {
    id: 6,
    companyName: 'Stripe',
    status: 0,
    appliedDate: '2025-01-28T00:00:00Z',
    postingUrl: 'https://stripe.com/jobs',
    notes: null,
    createdAt: '2025-01-28T11:00:00Z',
    lastModified: '2025-01-28T11:00:00Z',
  },
];

/** Returns true if a demo session is currently active in
 sessionStorage. */
export function isDemoModeActive(): boolean {
  return sessionStorage.getItem(DEMO_MODE_KEY) === 'true';
}

/** Starts a demo session and seeds sample data if the
 store is empty. */
export function initDemoSession(): void {
  sessionStorage.setItem(DEMO_MODE_KEY, 'true');
  if (!sessionStorage.getItem(DEMO_APPLICATIONS_KEY)) {
    sessionStorage.setItem(DEMO_APPLICATIONS_KEY,
      JSON.stringify(SAMPLE_APPLICATIONS));
  }
}

/** Clears all demo data from sessionStorage. */
export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_APPLICATIONS_KEY);
  sessionStorage.removeItem(DEMO_MODE_KEY);
}

/** Returns all demo applications from sessionStorage. */
export function getDemoApplications(): ApplicationRecord[] {
  const raw =
    sessionStorage.getItem(DEMO_APPLICATIONS_KEY);
  return raw ? (JSON.parse(raw) as ApplicationRecord[]) :
    [];
}

/** Persists the demo applications array to sessionStorage.
 */
export function setDemoApplications(records:
                                    ApplicationRecord[]): void {
  sessionStorage.setItem(DEMO_APPLICATIONS_KEY,
    JSON.stringify(records));
}

/** Returns a new auto-incremented ID for demo records. */
export function getNextDemoId(): number {
  return nextId++;
}
