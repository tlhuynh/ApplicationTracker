using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Models;

namespace ApplicationTracker.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for application record operations.
/// </summary>
public interface IApplicationRecordRepository : IRepository<ApplicationRecord> {
	/// <summary>
	/// Returns a filtered, sorted, paginated page of application records for the specified user.
	/// </summary>
	Task<PagedResult<ApplicationRecord>> GetPagedAsync(
		string userId, int page, int pageSize, string sortBy, string sortDir,
		string? search, List<ApplicationStatus>? statuses, DateTime? dateFrom, DateTime? dateTo);

	/// <summary>
	/// Returns all application records for the specified user, sorted by company name ascending.
	/// Used for data export — no pagination applied.
	/// </summary>
	Task<List<ApplicationRecord>> GetAllForExportAsync(string userId);

	/// <summary>
	/// Checks whether a duplicate application record exists in the database.
	/// Matches by CompanyName + PostingUrl when a URL is provided, or CompanyName + AppliedDate otherwise.
	/// </summary>
	Task<bool> ExistsAsync(string companyName, DateTime appliedDate, string? postingUrl, string userId);
}
