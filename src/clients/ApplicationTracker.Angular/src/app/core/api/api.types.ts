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
export type ApplicationRecordDto = components['schemas']['ApplicationRecordDto'];
export type ApplicationStatus = components['schemas']['ApplicationStatus'];
export type CreateApplicationRecordRequest = components['schemas']['CreateApplicationRecordRequest'];
export type UpdateApplicationRecordRequest = components['schemas']['UpdateApplicationRecordRequest'];
export type PatchStatusRequest = components['schemas']['PatchStatusRequest'];

// ── Excel Import ──────────────────────────────────────────────────────────
export type ExcelImportResultDto = components['schemas']['ExcelImportResultDto'];
export type ExcelImportErrorDto = components['schemas']['ExcelImportErrorDto'];
export type ParseExcelResultDto = components['schemas']['ParseExcelResultDto'];

// ── Email flows ───────────────────────────────────────────────────────────
export type ConfirmEmailRequest = components['schemas']['ConfirmEmailRequest'];
export type ResendConfirmationRequest = components['schemas']['ResendConfirmationRequest'];
export type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
export type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];
