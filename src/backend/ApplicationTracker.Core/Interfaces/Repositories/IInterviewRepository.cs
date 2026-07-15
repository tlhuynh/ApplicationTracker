using ApplicationTracker.Core.Entities;

namespace ApplicationTracker.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for interview operations.
/// </summary>
public interface IInterviewRepository : IRepository<Interview> {
    /// <summary>
    /// Returns all interviews for the specified application record, scoped to the user.
    /// Results are ordered by round number, then date.
    /// </summary>
    Task<List<Interview>> GetByApplicationRecordIdAsync(int applicationRecordId, string userId);

    /// <summary>
    /// Returns whether the specified application record exists and belongs to the user.
    /// Used to distinguish "application not found" from "no interviews yet".
    /// </summary>
    Task<bool> ApplicationRecordBelongsToUserAsync(int applicationRecordId, string userId);

    /// <summary>
    /// Marks all interviews for the given application record for deletion.
    /// Does not call SaveChangesAsync — the caller is responsible for persisting changes
    /// so all deletes within a single operation share one transaction.
    /// </summary>
    Task DeleteAllByApplicationRecordIdAsync(int applicationRecordId);
}