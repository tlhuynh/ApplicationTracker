using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Models;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service interface for application record business logic.
/// Works with entities only — DTO mapping is handled by the controller.
/// </summary>
public interface IApplicationRecordService {
	/// <summary>
	/// Returns a filtered, sorted, paginated page of application records for the specified user.
	/// </summary>
	Task<PagedResult<ApplicationRecord>> GetPagedAsync(
		string userId, int page, int pageSize, string sortBy, string sortDir,
		string? search, List<ApplicationStatus>? statuses, DateTime? dateFrom, DateTime? dateTo);

	/// <summary>
	/// Retrieves a single application record by its identifier, scoped to the specified user.
	/// </summary>
	/// <param name="id">The record identifier.</param>
	/// <param name="userId">The user identifier.</param>
	/// <returns>The record if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> GetByIdAsync(int id, string userId);

	/// <summary>
	/// Creates a new application record for the specified user.
	/// </summary>
	/// <param name="entity">The entity to create.</param>
	/// <param name="userId">The user identifier.</param>
	/// <returns>The created entity with database-generated fields populated.</returns>
	Task<ApplicationRecord> CreateAsync(ApplicationRecord entity, string userId);

	/// <summary>
	/// Updates an existing application record, scoped to the specified user.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="updatedFields">An entity containing the new field values.</param>
	/// <param name="userId">The user identifier.</param>
	/// <returns>The updated entity if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> UpdateAsync(int id, ApplicationRecord updatedFields, string userId);

	/// <summary>
	/// Updates only the status of an existing application record, scoped to the specified user.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="status">The new status value.</param>
	/// <param name="userId">The user identifier.</param>
	/// <returns>The updated entity if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> UpdateStatusAsync(int id, ApplicationStatus status, string userId);

	/// <summary>
	/// Soft-deletes an application record, scoped to the specified user.
	/// </summary>
	/// <param name="id">The identifier of the record to delete.</param>
	/// <param name="userId">The user identifier.</param>
	/// <returns><c>true</c> if the record was found and deleted; otherwise, <c>false</c>.</returns>
	Task<bool> DeleteAsync(int id, string userId);

	/// <summary>
	/// Exports all application records for the specified user as an Excel (.xlsx) byte array.
	/// Columns match the import template: CompanyName, Status, AppliedDate, PostingUrl, Notes.
	/// Records are sorted by company name ascending.
	/// </summary>
	Task<byte[]> ExportAsync(string userId);

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
