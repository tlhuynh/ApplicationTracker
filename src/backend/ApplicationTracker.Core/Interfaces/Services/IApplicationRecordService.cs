using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service interface for application record business logic.
/// Works with entities only — DTO mapping is handled by the controller.
/// </summary>
public interface IApplicationRecordService {
	/// <summary>
	/// Retrieves all application records.
	/// </summary>
	Task<List<ApplicationRecord>> GetAllAsync();

	/// <summary>
	/// Retrieves a single application record by its identifier.
	/// </summary>
	/// <param name="id">The record identifier.</param>
	/// <returns>The record if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> GetByIdAsync(int id);

	/// <summary>
	/// Creates a new application record.
	/// </summary>
	/// <param name="entity">The entity to create.</param>
	/// <returns>The created entity with database-generated fields populated.</returns>
	Task<ApplicationRecord> CreateAsync(ApplicationRecord entity);

	/// <summary>
	/// Updates an existing application record.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="updatedFields">An entity containing the new field values.</param>
	/// <returns>The updated entity if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> UpdateAsync(int id, ApplicationRecord updatedFields);

	/// <summary>
	/// Updates only the status of an existing application record.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="status">The new status value.</param>
	/// <returns>The updated entity if found; otherwise, <c>null</c>.</returns>
	Task<ApplicationRecord?> UpdateStatusAsync(int id, ApplicationStatus status);

	/// <summary>
	/// Soft-deletes an application record.
	/// </summary>
	/// <param name="id">The identifier of the record to delete.</param>
	/// <returns><c>true</c> if the record was found and deleted; otherwise, <c>false</c>.</returns>
	Task<bool> DeleteAsync(int id);
}
