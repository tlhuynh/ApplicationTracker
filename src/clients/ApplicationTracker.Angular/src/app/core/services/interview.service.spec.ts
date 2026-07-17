import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InterviewService } from './interview.service';

describe('InterviewService', () => {
  let service: InterviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InterviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAll ────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('sends GET to the interviews endpoint for the given application record', () => {
      service.getAll(1).subscribe();

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/applicationrecords/1/interviews'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('sends POST with the request body to the interviews endpoint', () => {
      const body = { type: 0, date: '2025-03-01T00:00:00.000Z' };
      service.create(1, body as never).subscribe();

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/applicationrecords/1/interviews'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 1, applicationRecordId: 1, ...body });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('sends PUT with the request body to the specific interview endpoint', () => {
      const body = { type: 1, date: '2025-04-01T00:00:00.000Z' };
      service.update(1, 3, body as never).subscribe();

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/applicationrecords/1/interviews/3'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 3, applicationRecordId: 1, ...body });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE to the specific interview endpoint', () => {
      service.delete(1, 3).subscribe();

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/applicationrecords/1/interviews/3'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});