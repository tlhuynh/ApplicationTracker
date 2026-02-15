using ApplicationTracker.Core.Entities;

namespace ApplicationTracker.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for application record operations.
/// </summary>
public interface IApplicationRecordRepository : IRepository<ApplicationRecord> {
	/// <summary>
	/// Checks whether a duplicate application record exists in the database.
	/// Matches by CompanyName + PostingUrl when a URL is provided, or CompanyName + AppliedDate otherwise.
	/// </summary>
	Task<bool> ExistsAsync(string companyName, DateTime appliedDate, string? postingUrl);
}
