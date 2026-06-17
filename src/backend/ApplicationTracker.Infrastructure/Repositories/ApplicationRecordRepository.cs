using ApplicationTracker.Core.Entities;
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
		string userId, int page, int pageSize, string sortBy, string sortDir) {
		IQueryable<ApplicationRecord> query = _dbSet.Where(r => r.UserId == userId);

		bool desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
		query = sortBy.ToLowerInvariant() switch {
			"status" => desc ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
			"applieddate" => desc ? query.OrderByDescending(r => r.AppliedDate) : query.OrderBy(r => r.AppliedDate),
			_ => desc ? query.OrderByDescending(r => r.CompanyName) : query.OrderBy(r => r.CompanyName),
		};

		int totalCount = await query.CountAsync();
		List<ApplicationRecord> items = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();

		return new PagedResult<ApplicationRecord> {
			Items = items,
			TotalCount = totalCount,
			Page = page,
			PageSize = pageSize,
		};
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
