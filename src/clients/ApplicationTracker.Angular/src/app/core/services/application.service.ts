import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApplicationRecordDto,
  CreateApplicationRecordRequest,
  UpdateApplicationRecordRequest,
  PatchStatusRequest,
} from '../api/api.types';

/** Provides CRUD operations for application records via the backend REST API. */
@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly _http = inject(HttpClient);

  /** Base URL for all application record endpoints. */
  private readonly _baseUrl = '/api/applicationrecords';

  /** Fetches all application records for the authenticated user. */
  public getAll(): Observable<ApplicationRecordDto[]> {
    return this._http.get<ApplicationRecordDto[]>(this._baseUrl);
  }

  /** Creates a new application record and returns the created entity. */
  public create(request: CreateApplicationRecordRequest): Observable<ApplicationRecordDto> {
    return this._http.post<ApplicationRecordDto>(this._baseUrl, request);
  }

  /**
   * Replaces all editable fields on an existing record.
   * Returns the updated entity.
   */
  public update(
    id: number,
    request: UpdateApplicationRecordRequest,
  ): Observable<ApplicationRecordDto> {
    return this._http.put<ApplicationRecordDto>(`${this._baseUrl}/${id}`, request);
  }

  /** Soft-deletes a record by ID (the backend sets IsDeleted = true). */
  public delete(id: number): Observable<void> {
    return this._http.delete<void>(`${this._baseUrl}/${id}`);
  }

  /**
   * Updates only the status field of a record via PATCH.
   * Used by the Advance and Reject inline row actions.
   */
  public patchStatus(id: number, request: PatchStatusRequest): Observable<ApplicationRecordDto> {
    return this._http.patch<ApplicationRecordDto>(`${this._baseUrl}/${id}/status`, request);
  }
}
