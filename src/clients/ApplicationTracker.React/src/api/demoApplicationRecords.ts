/*A mock API module with the exact same function signatures as applicationRecords.ts, but reads/writes the
demo store instead of calling the backend. This means pages don't need to know they're in demo mode — they just call
functions with the same shape.*/

import type { components } from '@/types/api';
import {
  getDemoApplications,
  setDemoApplications,
  getNextDemoId,
} from '@/api/demoStore';

type ApplicationRecord = components['schemas']['ApplicationRecordDto'];
type CreateRequest = components['schemas']['CreateApplicationRecordRequest'];
type UpdateRequest = components['schemas']['UpdateApplicationRecordRequest'];
type ExcelImportResult = components['schemas']['ExcelImportResultDto'];

export async function getAll(): Promise<ApplicationRecord[]> {
  return getDemoApplications();
}

export async function getById(id: number): Promise<ApplicationRecord> {
  const found = getDemoApplications().find((r) => r.id === id);
  if (!found) throw new Error('Record not found');
  return found;
}

export async function create(request: CreateRequest): Promise<ApplicationRecord> {
  const records = getDemoApplications();
  const now = new Date().toISOString();
  const newRecord: ApplicationRecord = {
    id: getNextDemoId(),
    companyName: request.companyName,
    status: request.status ?? 0,
    appliedDate: request.appliedDate ?? null,
    postingUrl: request.postingUrl ?? null,
    notes: request.notes ?? null,
    createdAt: now,
    lastModified: now,
  };
  setDemoApplications([...records, newRecord]);
  return newRecord;
}

export async function update(id: number, request: UpdateRequest): Promise<ApplicationRecord> {
  const records = getDemoApplications();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Record not found');
  const updated: ApplicationRecord = {
    ...records[index],
    companyName: request.companyName,
    status: request.status ?? records[index].status,
    appliedDate: request.appliedDate ?? null,
    postingUrl: request.postingUrl ?? null,
    notes: request.notes ?? null,
    lastModified: new Date().toISOString(),
  };
  const newRecords = [...records];
  newRecords[index] = updated;
  setDemoApplications(newRecords);
  return updated;
}

export async function patchStatus(id: number, status: number): Promise<ApplicationRecord> {
  const records = getDemoApplications();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Record not found');
  const updated: ApplicationRecord = {
    ...records[index],
    status,
    lastModified: new Date().toISOString(),
  };
  const newRecords = [...records];
  newRecords[index] = updated;
  setDemoApplications(newRecords);
  return updated;
}

export async function remove(id: number): Promise<void> {
  setDemoApplications(getDemoApplications().filter((r) => r.id !== id));
}

/** In demo mode, simulates an import by adding 3 sample records to the store. */
export async function importExcel(_file: File): Promise<ExcelImportResult> {
  const records = getDemoApplications();
  const now = new Date().toISOString();
  const added: ApplicationRecord[] = [
    {
      id: getNextDemoId(),
      companyName: 'Demo Import Co.',
      status: 0,
      appliedDate: now,
      postingUrl: null,
      notes: 'Added via demo import.',
      createdAt: now,
      lastModified: now,
    },
    {
      id: getNextDemoId(),
      companyName: 'Demo Startup',
      status: 1,
      appliedDate: now,
      postingUrl: null,
      notes: 'Added via demo import.',
      createdAt: now,
      lastModified: now,
    },
    {
      id: getNextDemoId(),
      companyName: 'Demo Corp',
      status: 0,
      appliedDate: now,
      postingUrl: null,
      notes: 'Added via demo import.',
      createdAt: now,
      lastModified: now,
    },
  ];
  setDemoApplications([...records, ...added]);
  return {
    importedCount: 3,
    totalRows: 3,
    failedCount: 0,
    errors: [],
  };
}
