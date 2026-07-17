using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Models;
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

	// ── Interview loading isolation ───────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_DoesNotLoadInterviews() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);

		ApplicationRecord record = new() { CompanyName = "Acme", UserId = "user-a" };
		context.ApplicationRecords.Add(record);
		await context.SaveChangesAsync();

		context.Set<Interview>().Add(new Interview {
			ApplicationRecordId = record.Id,
			Type = InterviewType.Screening,
			Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			"user-a", 1, 10, "companyName", "asc", null, null, null, null);

		// Assert — the Select projection in GetPagedAsync does not include Interviews
		Assert.Single(result.Items);
		Assert.Empty(result.Items[0].Interviews);
	}

	[Fact]
	public async Task GetAllForExportAsync_LoadsInterviews() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);

		ApplicationRecord record = new() { CompanyName = "Acme", UserId = "user-a" };
		context.ApplicationRecords.Add(record);
		await context.SaveChangesAsync();

		context.Set<Interview>().Add(new Interview {
			ApplicationRecordId = record.Id,
			Type = InterviewType.Screening,
			Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
			UserId = "user-a"
		});
		await context.SaveChangesAsync();

		// Act
		List<ApplicationRecord> records = await repository.GetAllForExportAsync("user-a");

		// Assert — GetAllForExportAsync uses .Include(r => r.Interviews) so they are loaded
		Assert.Single(records);
		Assert.Single(records[0].Interviews);
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
