import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateInterviewRequest, InterviewDto, UpdateInterviewRequest } from '../api/api.types';

/** Provides CRUD operations for interviews via the backend REST API. */
@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = `${environment.apiUrl}/api/applicationrecords`;

  /** Fetches all interviews for the given application record. Only called when the dialog opens. */
  public getAll(applicationRecordId: number): Observable<InterviewDto[]> {
    return this._http.get<InterviewDto[]>(`${this._baseUrl}/${applicationRecordId}/interviews`);
  }

  /** Creates a new interview for the given application record. */
  public create(applicationRecordId: number, request: CreateInterviewRequest): Observable<InterviewDto> {
    return this._http.post<InterviewDto>(`${this._baseUrl}/${applicationRecordId}/interviews`, request);
  }

  /** Updates an existing interview. */
  public update(applicationRecordId: number, id: number, request: UpdateInterviewRequest): Observable<InterviewDto> {
    return this._http.put<InterviewDto>(`${this._baseUrl}/${applicationRecordId}/interviews/${id}`, request);
  }

  /** Soft-deletes an interview. */
  public delete(applicationRecordId: number, id: number): Observable<void> {
    return this._http.delete<void>(`${this._baseUrl}/${applicationRecordId}/interviews/${id}`);
  }
}