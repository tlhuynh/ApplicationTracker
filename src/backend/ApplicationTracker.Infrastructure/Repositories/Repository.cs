using ApplicationTracker.Core.Entities.Base;
using ApplicationTracker.Core.Interfaces;
using ApplicationTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation using EF Core.
/// </summary>
public class Repository<T>(ApplicationDbContext context) : IRepository<T>
	where T : BaseEntity {
	private readonly DbSet<T> _dbSet = context.Set<T>();

	public async Task<T?> GetByIdAsync(int id) {
		return await _dbSet.FindAsync(id);
	}

	public async Task<List<T>> GetAllAsync() {
		return await _dbSet.ToListAsync();
	}

	public async Task AddAsync(T entity) {
		await _dbSet.AddAsync(entity);
	}

	public void Update(T entity) {
		_dbSet.Update(entity);
	}

	public void Delete(T entity) {
		_dbSet.Remove(entity);
	}

	public async Task SaveChangesAsync() {
		await context.SaveChangesAsync();
	}
}
