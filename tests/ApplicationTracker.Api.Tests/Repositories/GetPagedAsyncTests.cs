using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Models;
using ApplicationTracker.Infrastructure.Data;
using ApplicationTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ApplicationTracker.Api.Tests.Repositories;

/// <summary>
/// Integration tests for <see cref="ApplicationRecordRepository.GetPagedAsync"/>
/// covering compound sort logic, filter params, pagination, and user scoping.
/// </summary>
public class GetPagedAsyncTests {
	private const string UserId = "user-test";

	private static ApplicationDbContext CreateContext() {
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		return new ApplicationDbContext(options);
	}

	// ── Sort by status ────────────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_SortByStatusAsc_ReturnsInPriorityOrder() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Rejected,     AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Offered,      AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Applied,      AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "D", Status = ApplicationStatus.Withdrawn,    AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "E", Status = ApplicationStatus.Interviewing, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "status", "asc", null, null, null, null);

		// Assert — priority: Offered=0, Interviewing=1, Applied=2, Rejected=3, Withdrawn=4
		ApplicationStatus[] expected = [
			ApplicationStatus.Offered,
			ApplicationStatus.Interviewing,
			ApplicationStatus.Applied,
			ApplicationStatus.Rejected,
			ApplicationStatus.Withdrawn,
		];
		Assert.Equal(expected, result.Items.Select(r => r.Status).ToArray());
	}

	[Fact]
	public async Task GetPagedAsync_SortByStatusDesc_ReturnsInReversePriorityOrder() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Offered,   AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied,   AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Withdrawn, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "status", "desc", null, null, null, null);

		// Assert
		ApplicationStatus[] expected = [
			ApplicationStatus.Withdrawn,
			ApplicationStatus.Applied,
			ApplicationStatus.Offered,
		];
		Assert.Equal(expected, result.Items.Select(r => r.Status).ToArray());
	}

	[Fact]
	public async Task GetPagedAsync_SortByStatusAsc_WhenSameStatus_OrdersByAppliedDateDesc() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime older = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime newer = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = older, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = newer, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "status", "asc", null, null, null, null);

		// Assert — secondary sort is ThenByDescending(AppliedDate), so newer comes first
		Assert.Equal(newer, result.Items[0].AppliedDate);
		Assert.Equal(older, result.Items[1].AppliedDate);
	}

	// ── Sort by appliedDate ───────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_SortByAppliedDateAsc_ReturnsByDateAscending() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime jan = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime mar = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime jun = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = jun, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = jan, UserId = UserId },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Applied, AppliedDate = mar, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "appliedDate", "asc", null, null, null, null);

		// Assert
		DateTime?[] expected = [jan, mar, jun];
		Assert.Equal(expected, result.Items.Select(r => r.AppliedDate).ToArray());
	}

	[Fact]
	public async Task GetPagedAsync_SortByAppliedDateDesc_ReturnsByDateDescending() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime jan = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime jun = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = jan, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = jun, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "appliedDate", "desc", null, null, null, null);

		// Assert
		DateTime?[] expected = [jun, jan];
		Assert.Equal(expected, result.Items.Select(r => r.AppliedDate).ToArray());
	}

	[Fact]
	public async Task GetPagedAsync_SortByAppliedDateAsc_WhenSameDate_OrdersByStatusPriorityAsc() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Rejected, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Offered,  AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "appliedDate", "asc", null, null, null, null);

		// Assert — secondary sort is ThenBy(priority asc); Offered=0, Rejected=3, so Offered is first
		Assert.Equal(ApplicationStatus.Offered, result.Items[0].Status);
		Assert.Equal(ApplicationStatus.Rejected, result.Items[1].Status);
	}

	// ── Sort by companyName ───────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_SortByCompanyNameAsc_ReturnsByNameAlphabetically() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Zeta",  Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Alpha", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",  Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, null, null);

		// Assert
		string[] expected = ["Alpha", "Meta", "Zeta"];
		Assert.Equal(expected, result.Items.Select(r => r.CompanyName).ToArray());
	}

	[Fact]
	public async Task GetPagedAsync_SortByCompanyNameDesc_ReturnsByNameReverseAlphabetically() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Alpha", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Zeta",  Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",  Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "desc", null, null, null, null);

		// Assert
		string[] expected = ["Zeta", "Meta", "Alpha"];
		Assert.Equal(expected, result.Items.Select(r => r.CompanyName).ToArray());
	}

	// ── Filters ───────────────────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_WithSearchFilter_ReturnsMatchingCompanyNames() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Google",        Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",          Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Google DeepMind", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", "Google", null, null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
		Assert.All(result.Items, r => Assert.Contains("Google", r.CompanyName));
	}

	[Fact]
	public async Task GetPagedAsync_WithSearchFilter_ExcludesNonMatchingRecords() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Google", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",   Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", "Apple", null, null, null);

		// Assert
		Assert.Equal(0, result.TotalCount);
		Assert.Empty(result.Items);
	}

	[Fact]
	public async Task GetPagedAsync_WithStatusesFilter_ReturnsOnlyMatchingStatuses() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied,      AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Interviewing, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Rejected,     AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "D", Status = ApplicationStatus.Withdrawn,    AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		List<ApplicationStatus> filter = [ApplicationStatus.Rejected, ApplicationStatus.Withdrawn];

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, filter, null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
		Assert.All(result.Items, r => Assert.Contains(r.Status, filter));
	}

	[Fact]
	public async Task GetPagedAsync_WithEmptyStatusesFilter_ReturnsAllRecords() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied,   AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Rejected,  AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act — empty list means "no filter", not "match nothing"
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, [], null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
	}

	[Fact]
	public async Task GetPagedAsync_WithDateFromFilter_ExcludesRecordsBeforeDate() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime before = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime after  = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime cutoff = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = before, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = after,  UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, cutoff, null);

		// Assert
		Assert.Equal(1, result.TotalCount);
		Assert.Equal("B", result.Items[0].CompanyName);
	}

	[Fact]
	public async Task GetPagedAsync_WithDateFromFilter_IncludesRecordOnExactDate() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime exact = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = exact, UserId = UserId,
		});
		await context.SaveChangesAsync();

		// Act — dateFrom == appliedDate should be inclusive
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, exact, null);

		// Assert
		Assert.Equal(1, result.TotalCount);
	}

	[Fact]
	public async Task GetPagedAsync_WithDateToFilter_ExcludesRecordsAfterDate() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime before = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime after  = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime cutoff = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = before, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = after,  UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, null, cutoff);

		// Assert
		Assert.Equal(1, result.TotalCount);
		Assert.Equal("A", result.Items[0].CompanyName);
	}

	[Fact]
	public async Task GetPagedAsync_WithDateToFilter_IncludesRecordOnExactDate() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime exact = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.Add(new ApplicationRecord {
			CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = exact, UserId = UserId,
		});
		await context.SaveChangesAsync();

		// Act — dateTo == appliedDate should be inclusive (repository uses < dateTo.Date.AddDays(1))
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, null, exact);

		// Assert
		Assert.Equal(1, result.TotalCount);
	}

	[Fact]
	public async Task GetPagedAsync_WithDateRange_ReturnsOnlyRecordsInRange() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime jan = new(2025, 1, 1,  0, 0, 0, DateTimeKind.Utc);
		DateTime mar = new(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc);
		DateTime jun = new(2025, 6, 1,  0, 0, 0, DateTimeKind.Utc);
		DateTime from = new(2025, 2, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime to   = new(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = jan, UserId = UserId },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = mar, UserId = UserId },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Applied, AppliedDate = jun, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", null, null, from, to);

		// Assert
		Assert.Equal(1, result.TotalCount);
		Assert.Equal("B", result.Items[0].CompanyName);
	}

	[Fact]
	public async Task GetPagedAsync_WithSearchAndStatusesFilter_AppliesBothFilters() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Google", Status = ApplicationStatus.Applied,  AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Google", Status = ApplicationStatus.Rejected, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",   Status = ApplicationStatus.Applied,  AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 10, "companyName", "asc", "Google", [ApplicationStatus.Applied], null, null);

		// Assert — only the Google/Applied record matches both filters
		Assert.Equal(1, result.TotalCount);
		Assert.Equal("Google", result.Items[0].CompanyName);
		Assert.Equal(ApplicationStatus.Applied, result.Items[0].Status);
	}

	// ── Pagination ────────────────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_Pagination_ReturnsCorrectPage() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		for (int i = 1; i <= 5; i++) {
			context.ApplicationRecords.Add(new ApplicationRecord {
				CompanyName = $"Company {i:D2}",
				Status = ApplicationStatus.Applied,
				AppliedDate = date,
				UserId = UserId,
			});
		}
		await context.SaveChangesAsync();

		// Act — page 2, size 2 → items 3 & 4 (alphabetical order)
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 2, 2, "companyName", "asc", null, null, null, null);

		// Assert
		Assert.Equal(5, result.TotalCount);
		Assert.Equal(2, result.Items.Count);
		Assert.Equal("Company 03", result.Items[0].CompanyName);
		Assert.Equal("Company 04", result.Items[1].CompanyName);
	}

	[Fact]
	public async Task GetPagedAsync_TotalCount_ReflectsFilteredSetNotFullSet() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "Google",   Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Meta",     Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
			new ApplicationRecord { CompanyName = "Google X", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = UserId },
		]);
		await context.SaveChangesAsync();

		// Act — 3 records total, 2 match "Google"; with pageSize 1 we still expect TotalCount=2
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			UserId, 1, 1, "companyName", "asc", "Google", null, null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
		Assert.Single(result.Items);
	}

	// ── User scoping ──────────────────────────────────────────────────────────

	[Fact]
	public async Task GetPagedAsync_OnlyReturnsRecordsForSpecifiedUser() {
		// Arrange
		await using ApplicationDbContext context = CreateContext();
		ApplicationRecordRepository repository = new(context);
		DateTime date = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		context.ApplicationRecords.AddRange([
			new ApplicationRecord { CompanyName = "A", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = "user-a" },
			new ApplicationRecord { CompanyName = "B", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = "user-b" },
			new ApplicationRecord { CompanyName = "C", Status = ApplicationStatus.Applied, AppliedDate = date, UserId = "user-a" },
		]);
		await context.SaveChangesAsync();

		// Act
		PagedResult<ApplicationRecord> result = await repository.GetPagedAsync(
			"user-a", 1, 10, "companyName", "asc", null, null, null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
		Assert.All(result.Items, r => Assert.Equal("user-a", r.UserId));
	}
}