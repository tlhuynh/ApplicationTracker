/**
 * Central re-exports of generated API schema types.
 * Import from this file instead of referencing components['schemas'] directly.
 * Re-run `npm run generate-types` whenever the backend API changes.
 */
import type { components } from './api';

// ── Auth ──────────────────────────────────────────────────────────────────
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type AuthResponse = components['schemas']['AuthResponse'];

// ── Application Records ───────────────────────────────────────────────────
// Extended with hasDescription until next generate-types run picks it up from the schema
export type ApplicationRecordDto = components['schemas']['ApplicationRecordDto'] & { hasDescription?: boolean };
export type ApplicationStatus = components['schemas']['ApplicationStatus'];
export type CreateApplicationRecordRequest = components['schemas']['CreateApplicationRecordRequest'] & { description?: string | null };
export type UpdateApplicationRecordRequest = components['schemas']['UpdateApplicationRecordRequest'] & { description?: string | null };
export type PatchStatusRequest = components['schemas']['PatchStatusRequest'];

export interface DescriptionDto {
  description: string | null;
}

export interface PatchDescriptionRequest {
  description: string | null;
}

// ── Pagination ────────────────────────────────────────────────────────────

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAllParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search?: string;
  statuses?: number[];
  dateFrom?: Date;
  dateTo?: Date;
}

// ── Excel Import ──────────────────────────────────────────────────────────
export type ExcelImportResultDto = components['schemas']['ExcelImportResultDto'];
export type ExcelImportErrorDto = components['schemas']['ExcelImportErrorDto'];
export type ParseExcelResultDto = components['schemas']['ParseExcelResultDto'];

// ── Interviews ────────────────────────────────────────────────────────────
export type InterviewDto = components['schemas']['InterviewDto'];
export type CreateInterviewRequest = components['schemas']['CreateInterviewRequest'];
export type UpdateInterviewRequest = components['schemas']['UpdateInterviewRequest'];
export type InterviewType = components['schemas']['InterviewType'];
export type InterviewOutcome = components['schemas']['InterviewOutcome'];

// ── Email flows ───────────────────────────────────────────────────────────
export type ConfirmEmailRequest = components['schemas']['ConfirmEmailRequest'];
export type ResendConfirmationRequest = components['schemas']['ResendConfirmationRequest'];
export type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
export type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];
