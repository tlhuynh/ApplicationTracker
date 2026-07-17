using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Models;
using ApplicationTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for application record operations.
/// </summary>
public class ApplicationRecordRepository(ApplicationDbContext context) : Repository<ApplicationRecord>(context),
	IApplicationRecordRepository {
	/// <inheritdoc />
	public async Task<PagedResult<ApplicationRecord>> GetPagedAsync(
		string userId, int page, int pageSize, string sortBy, string sortDir,
		string? search, List<ApplicationStatus>? statuses, DateTime? dateFrom, DateTime? dateTo) {
		IQueryable<ApplicationRecord> query = _dbSet.AsNoTracking().Where(r => r.UserId == userId);

		if (!string.IsNullOrWhiteSpace(search)) {
			query = query.Where(r => r.CompanyName.Contains(search));
		}

		if (statuses is { Count: > 0 }) {
			query = query.Where(r => statuses.Contains(r.Status));
		}

		if (dateFrom.HasValue) {
			DateTime from = dateFrom.Value.Date;
			query = query.Where(r => r.AppliedDate >= from);
		}

		if (dateTo.HasValue) {
			DateTime to = dateTo.Value.Date.AddDays(1);
			query = query.Where(r => r.AppliedDate < to);
		}

		// Status priority: Offered(2)=0, Interviewing(1)=1, Applied(0)=2, Rejected(3)=3, Withdrawn(4)=4
		// EF Core translates the nested ternary to a CASE WHEN expression in SQL.
		bool desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
		query = sortBy.ToLowerInvariant() switch {
			"status" => desc
				? query.OrderByDescending(r =>
						r.Status == ApplicationStatus.Offered ? 0 :
						r.Status == ApplicationStatus.Interviewing ? 1 :
						r.Status == ApplicationStatus.Applied ? 2 :
						r.Status == ApplicationStatus.Rejected ? 3 : 4)
					.ThenByDescending(r => r.AppliedDate)
				: query.OrderBy(r =>
						r.Status == ApplicationStatus.Offered ? 0 :
						r.Status == ApplicationStatus.Interviewing ? 1 :
						r.Status == ApplicationStatus.Applied ? 2 :
						r.Status == ApplicationStatus.Rejected ? 3 : 4)
					.ThenByDescending(r => r.AppliedDate),
			"applieddate" => desc
				? query.OrderByDescending(r => r.AppliedDate)
					.ThenBy(r =>
						r.Status == ApplicationStatus.Offered ? 0 :
						r.Status == ApplicationStatus.Interviewing ? 1 :
						r.Status == ApplicationStatus.Applied ? 2 :
						r.Status == ApplicationStatus.Rejected ? 3 : 4)
				: query.OrderBy(r => r.AppliedDate)
					.ThenBy(r =>
						r.Status == ApplicationStatus.Offered ? 0 :
						r.Status == ApplicationStatus.Interviewing ? 1 :
						r.Status == ApplicationStatus.Applied ? 2 :
						r.Status == ApplicationStatus.Rejected ? 3 : 4),
			_ => desc
				? query.OrderByDescending(r => r.CompanyName).ThenByDescending(r => r.AppliedDate)
				: query.OrderBy(r => r.CompanyName).ThenByDescending(r => r.AppliedDate),
		};

		int totalCount = await query.CountAsync();
		List<ApplicationRecord> items = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.Select(r => new ApplicationRecord {
				Id = r.Id,
				CompanyName = r.CompanyName,
				Status = r.Status,
				AppliedDate = r.AppliedDate,
				PostingUrl = r.PostingUrl,
				Notes = r.Notes,
				UserId = r.UserId,
				IsDeleted = r.IsDeleted,
				CreatedAt = r.CreatedAt,
				LastModified = r.LastModified,
				HasDescription = r.Description != null,
				// Description text intentionally excluded — fetched separately on demand
			})
			.ToListAsync();

		return new PagedResult<ApplicationRecord> {
			Items = items,
			TotalCount = totalCount,
			Page = page,
			PageSize = pageSize,
		};
	}

	/// <inheritdoc />
	public async Task<List<ApplicationRecord>> GetAllForExportAsync(string userId) {
		return await _dbSet
			.AsNoTracking()
			.Include(r => r.Interviews)
			.Where(r => r.UserId == userId)
			.OrderBy(r => r.CompanyName)
			.ThenByDescending(r => r.AppliedDate)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<(bool Found, string? Description)> GetDescriptionAsync(int id, string userId) {
		bool exists = await _dbSet.AnyAsync(r => r.Id == id && r.UserId == userId);
		if (!exists) {
			return (false, null);
		}

		string? description = await _dbSet
			.AsNoTracking()
			.Where(r => r.Id == id && r.UserId == userId)
			.Select(r => r.Description)
			.FirstOrDefaultAsync();

		return (true, description);
	}

	/// <inheritdoc />
	public async Task<bool> UpdateDescriptionAsync(int id, string? description, string userId) {
		ApplicationRecord? existing = await _dbSet.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
		if (existing is null) {
			return false;
		}

		existing.Description = description;
		await SaveChangesAsync();
		return true;
	}

	/// <inheritdoc />
	public async Task<bool> ExistsAsync(string companyName, DateTime appliedDate, string? postingUrl, string userId) {
		if (!string.IsNullOrWhiteSpace(postingUrl)) {
			return await _dbSet.AnyAsync(r =>
				r.UserId == userId && r.CompanyName == companyName && r.PostingUrl == postingUrl);
		}

		return await _dbSet.AnyAsync(r =>
			r.UserId == userId && r.CompanyName == companyName && r.AppliedDate.HasValue &&
			r.AppliedDate.Value.Date == appliedDate.Date);
	}
}
