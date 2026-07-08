using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Interfaces.Services;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Service implementation for interview business logic.
/// </summary>
public class InterviewService(IInterviewRepository repository) : IInterviewService {
    /// <inheritdoc />
    public async Task<List<Interview>?> GetAllAsync(int applicationRecordId, string userId) {
        bool exists = await repository.ApplicationRecordBelongsToUserAsync(applicationRecordId, userId);
        if (!exists) {
            return null;
        }

        return await repository.GetByApplicationRecordIdAsync(applicationRecordId, userId);
    }

    /// <inheritdoc />
    public async Task<Interview?> CreateAsync(int applicationRecordId, Interview entity, string userId) {
        bool exists = await repository.ApplicationRecordBelongsToUserAsync(applicationRecordId, userId);
        if (!exists) {
            return null;
        }

        entity.ApplicationRecordId = applicationRecordId;
        entity.UserId = userId;
        await repository.AddAsync(entity);
        await repository.SaveChangesAsync();
        return entity;
    }

    /// <inheritdoc />
    public async Task<Interview?> UpdateAsync(int applicationRecordId, int id, Interview updatedFields, string userId) {
        Interview? existing = await repository.GetByIdAsync(id, userId);
        if (existing is null || existing.ApplicationRecordId != applicationRecordId) {
            return null;
        }

        existing.Type = updatedFields.Type;
        existing.RoundNumber = updatedFields.RoundNumber;
        existing.Date = updatedFields.Date;
        existing.Outcome = updatedFields.Outcome;
        existing.Notes = updatedFields.Notes;

        repository.Update(existing);
        await repository.SaveChangesAsync();
        return existing;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int applicationRecordId, int id, string userId) {
        Interview? existing = await repository.GetByIdAsync(id, userId);
        if (existing is null || existing.ApplicationRecordId != applicationRecordId) {
            return false;
        }

        repository.Delete(existing);
        await repository.SaveChangesAsync();
        return true;
    }
}