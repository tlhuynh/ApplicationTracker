import type { components } from '@/types/api';
import { ApiError, authFetch, handleResponse } from '@/api/client';

// Type aliases for convenience — the generated types use verbose paths
type ApplicationRecord = components['schemas']['ApplicationRecordDto'];
type CreateRequest = components['schemas']['CreateApplicationRecordRequest'];
type UpdateRequest = components['schemas']['UpdateApplicationRecordRequest'];
type ExcelImportResult = components['schemas']['ExcelImportResultDto'];

const BASE_URL = '/api/applicationrecords';

/** Fetches all application records. */
export async function getAll(): Promise<ApplicationRecord[]> {
  const response = await authFetch(BASE_URL);
  return handleResponse<ApplicationRecord[]>(response);
}

/** Fetches a single application record by its ID. */
export async function getById(id: number): Promise<ApplicationRecord> {
  const response = await authFetch(`${BASE_URL}/${id}`);
  return handleResponse<ApplicationRecord>(response);
}

/** Creates a new application record and returns the created record. */
export async function create(request: CreateRequest): Promise<ApplicationRecord> {
  const response = await authFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ApplicationRecord>(response);
}

/** Updates an existing application record and returns the updated record. */
export async function update(id: number, request: UpdateRequest): Promise<ApplicationRecord> {
  const response = await authFetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ApplicationRecord>(response);
}

/** Updates only the status of an application record. */
export async function patchStatus(id: number, status: number): Promise<ApplicationRecord> {
  const response = await authFetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<ApplicationRecord>(response);
}

/** Soft-deletes an application record by its ID. */
export async function remove(id: number): Promise<void> {
  const response = await authFetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
}

/** Imports application records from an Excel (.xlsx) file. */
export async function importExcel(file: File): Promise<ExcelImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await authFetch(`${BASE_URL}/import`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ExcelImportResult>(response);
}

export { ApiError };
export type { ApplicationRecord, CreateRequest, UpdateRequest, ExcelImportResult };
