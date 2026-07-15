using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for interview operations.
/// </summary>
public class InterviewRepository(ApplicationDbContext context) : Repository<Interview>(context),
    IInterviewRepository {
    /// <inheritdoc />
    public async Task<List<Interview>> GetByApplicationRecordIdAsync(int applicationRecordId, string userId) {
        return await _dbSet
            .AsNoTracking()
            .Where(i => i.ApplicationRecordId == applicationRecordId && i.UserId == userId)
            .OrderBy(i => i.RoundNumber)
            .ThenBy(i => i.Date)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> ApplicationRecordBelongsToUserAsync(int applicationRecordId, string userId) {
        return await context.ApplicationRecords
            .AnyAsync(r => r.Id == applicationRecordId && r.UserId == userId);
    }

    /// <inheritdoc />
    public async Task DeleteAllByApplicationRecordIdAsync(int applicationRecordId) {
        List<Interview> interviews = await _dbSet
            .Where(i => i.ApplicationRecordId == applicationRecordId)
            .ToListAsync();
        _dbSet.RemoveRange(interviews);
    }
}
