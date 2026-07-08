using ApplicationTracker.Core.Entities;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service interface for interview business logic.
/// Works with entities only — DTO mapping is handled by the controller.
/// </summary>
public interface IInterviewService {
    /// <summary>
    /// Returns all interviews for the specified application record, scoped to the user.
    /// </summary>
    /// <returns>The list of interviews, or <c>null</c> if the application record was not found.</returns>
    Task<List<Interview>?> GetAllAsync(int applicationRecordId, string userId);

    /// <summary>
    /// Creates a new interview for the specified application record.
    /// </summary>
    /// <returns>The created interview, or <c>null</c> if the application record was not found.</returns>
    Task<Interview?> CreateAsync(int applicationRecordId, Interview entity, string userId);

    /// <summary>
    /// Updates an existing interview, scoped to the user.
    /// </summary>
    /// <returns>The updated interview, or <c>null</c> if the interview was not found.</returns>
    Task<Interview?> UpdateAsync(int applicationRecordId, int id, Interview updatedFields, string userId);

    /// <summary>
    /// Soft-deletes an interview, scoped to the user.
    /// </summary>
    /// <returns><c>true</c> if found and deleted; otherwise, <c>false</c>.</returns>
    Task<bool> DeleteAsync(int applicationRecordId, int id, string userId);
}