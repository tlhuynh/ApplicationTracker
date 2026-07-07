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

	/// <summary>
	/// Returns the description of a single record, scoped to the specified user.
	/// </summary>
	/// <returns>
	/// A tuple where <c>Found</c> is <c>false</c> if no record matched,
	/// or <c>true</c> with the (possibly null) description if the record exists.
	/// </returns>
	Task<(bool Found, string? Description)> GetDescriptionAsync(int id, string userId);

	/// <summary>
	/// Updates only the description of an existing record, scoped to the specified user.
	/// </summary>
	/// <returns><c>true</c> if the record was found and updated; otherwise, <c>false</c>.</returns>
	Task<bool> UpdateDescriptionAsync(int id, string? description, string userId);
}
