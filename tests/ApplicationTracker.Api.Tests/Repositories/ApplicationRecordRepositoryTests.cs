using ApplicationTracker.Core.Entities;
using ApplicationTracker.Infrastructure.Data;
using ApplicationTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Api.Tests.Repositories;

/// <summary>
/// Integration tests for <see cref="ApplicationRecordRepository"/> duplicate checks.
/// </summary>
public class ApplicationRecordRepositoryTests {
	private static ApplicationDbContext CreateContext() {
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		return new ApplicationDbContext(options);
	}

	[Fact]
	public async Task ExistsAsync_WithMatchingPostingUrlForDifferentUser_ReturnsFalse() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime appliedDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "Acme",
			AppliedDate = appliedDate,
			PostingUrl = "https://acme.com/jobs/1",
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		bool exists = await repository.ExistsAsync("Acme", appliedDate, "https://acme.com/jobs/1", "user-b");

		// Assert
		Assert.False(exists);
	}

	[Fact]
	public async Task ExistsAsync_WithMatchingPostingUrlForSameUser_ReturnsTrue() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime appliedDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "Acme",
			AppliedDate = appliedDate,
			PostingUrl = "https://acme.com/jobs/1",
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		bool exists = await repository.ExistsAsync("Acme", appliedDate, "https://acme.com/jobs/1", "user-a");

		// Assert
		Assert.True(exists);
	}

	[Fact]
	public async Task ExistsAsync_WithMatchingAppliedDateForDifferentUser_ReturnsFalse() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime appliedDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "Acme",
			AppliedDate = appliedDate,
			PostingUrl = null,
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		bool exists = await repository.ExistsAsync("Acme", appliedDate, null, "user-b");

		// Assert
		Assert.False(exists);
	}

	[Fact]
	public async Task ExistsAsync_WithMatchingAppliedDateForSameUser_ReturnsTrue() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime appliedDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "Acme",
			AppliedDate = appliedDate,
			PostingUrl = null,
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		bool exists = await repository.ExistsAsync("Acme", appliedDate, null, "user-a");

		// Assert
		Assert.True(exists);
	}
}
