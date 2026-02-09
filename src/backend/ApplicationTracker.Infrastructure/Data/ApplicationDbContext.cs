using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Entities.Base;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Infrastructure.Data;

/// <summary>
/// EF Core database context for the application.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options) {
	public DbSet<ApplicationRecord> ApplicationRecords => Set<ApplicationRecord>();

	protected override void OnModelCreating(ModelBuilder modelBuilder) {
		base.OnModelCreating(modelBuilder);
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
	}

	public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) {
		foreach (Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<BaseEntity> entry
		         in ChangeTracker.Entries<BaseEntity>()) {
			switch (entry.State) {
				case EntityState.Added:
					entry.Entity.CreatedAt = DateTime.UtcNow;
					entry.Entity.LastModified = DateTime.UtcNow;
					break;
				case EntityState.Modified:
					entry.Entity.LastModified = DateTime.UtcNow;
					break;
				case EntityState.Deleted:
					entry.State = EntityState.Modified;
					entry.Entity.LastModified = DateTime.UtcNow;
					entry.Entity.IsDeleted = true;
					break;
				case EntityState.Detached:
				case EntityState.Unchanged:
				default:
					break;
			}
		}

		return base.SaveChangesAsync(cancellationToken);
	}
}
