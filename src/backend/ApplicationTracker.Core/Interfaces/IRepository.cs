using ApplicationTracker.Core.Entities.Base;

namespace ApplicationTracker.Core.Interfaces;

/// <summary>
/// Generic repository interface for CRUD operations on domain entities.
/// </summary>
public interface IRepository<T> where T : BaseEntity {
	Task<T?> GetByIdAsync(int id);
	Task<List<T>> GetAllAsync();
	Task AddAsync(T entity);
	void Update(T entity);
	void Delete(T entity);
	Task SaveChangesAsync();
}

// Note: Update and Delete are synchronous because EF Core's Update/Remove just mark entity state,
// no DB call happens until SaveChangesAsync.
