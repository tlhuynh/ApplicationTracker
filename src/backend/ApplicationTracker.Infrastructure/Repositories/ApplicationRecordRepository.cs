using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for application record operations.
/// </summary>
public class ApplicationRecordRepository(ApplicationDbContext context) : Repository<ApplicationRecord>(context),
	IApplicationRecordRepository {
	/// <inheritdoc />
	public async Task<bool> ExistsAsync(string companyName, DateTime appliedDate, string? postingUrl, string userId) {
		if (postingUrl is not null) {
			return await _dbSet.AnyAsync(r =>
				r.CompanyName == companyName && r.PostingUrl == postingUrl);
		}

		return await _dbSet.AnyAsync(r =>
			r.CompanyName == companyName && r.AppliedDate.HasValue && r.AppliedDate.Value.Date == appliedDate.Date);
	}
}
