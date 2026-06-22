using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Models;
using Moq;

namespace ApplicationTracker.Api.Tests.Services;

/// <summary>
/// Unit tests for <see cref="ApplicationRecordService"/>.
/// </summary>
public class ApplicationRecordServiceTests {
	private const string TestUserId = "test-user-id";
	private readonly Mock<IApplicationRecordRepository> _repositoryMock;
	private readonly ApplicationRecordService _service;

	public ApplicationRecordServiceTests() {
		_repositoryMock = new Mock<IApplicationRecordRepository>();
		_service = new ApplicationRecordService(_repositoryMock.Object);
	}

	[Fact]
	public async Task GetPagedAsync_DelegatesToRepositoryAndReturnsResult() {
		// Arrange
		PagedResult<ApplicationRecord> pagedResult = new() {
			Items = [new() { Id = 1, CompanyName = "Acme" }, new() { Id = 2, CompanyName = "Globex" }],
			TotalCount = 2,
			Page = 1,
			PageSize = 10,
		};
		_repositoryMock
			.Setup(r => r.GetPagedAsync(TestUserId, 1, 10, "companyName", "asc", null, null, null, null))
			.ReturnsAsync(pagedResult);

		// Act
		PagedResult<ApplicationRecord> result = await _service.GetPagedAsync(TestUserId, 1, 10, "companyName", "asc", null, null, null, null);

		// Assert
		Assert.Equal(2, result.TotalCount);
		Assert.Equal(2, result.Items.Count);
		Assert.Equal("Acme", result.Items[0].CompanyName);
		_repositoryMock.Verify(r => r.GetPagedAsync(TestUserId, 1, 10, "companyName", "asc", null, null, null, null), Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_WhenFound_ReturnsRecord() {
		// Arrange
		ApplicationRecord record = new() { Id = 1, CompanyName = "Acme" };
		_repositoryMock.Setup(r => r.GetByIdAsync(1, TestUserId)).ReturnsAsync(record);

		// Act
		ApplicationRecord? result = await _service.GetByIdAsync(1, TestUserId);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("Acme", result.CompanyName);
	}

	[Fact]
	public async Task GetByIdAsync_WhenNotFound_ReturnsNull() {
		// Arrange
		_repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ApplicationRecord? result = await _service.GetByIdAsync(99, TestUserId);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task CreateAsync_SetsUserIdAddsEntityAndSavesChanges() {
		// Arrange
		ApplicationRecord entity = new() { CompanyName = "Acme", Status = ApplicationStatus.Applied };

		// Act
		ApplicationRecord result = await _service.CreateAsync(entity, TestUserId);

		// Assert
		Assert.Equal("Acme", result.CompanyName);
		Assert.Equal(TestUserId, result.UserId);
		_repositoryMock.Verify(r => r.AddAsync(entity), Times.Once);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task UpdateAsync_WhenFound_UpdatesAndReturnsRecord() {
		// Arrange
		ApplicationRecord existing = new() { Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Applied };
		ApplicationRecord updatedFields = new() {
			CompanyName = "Acme Corp",
			Status = ApplicationStatus.Interviewing,
			AppliedDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
			PostingUrl = "https://example.com",
			Notes = "Updated"
		};
		_repositoryMock.Setup(r => r.GetByIdAsync(1, TestUserId)).ReturnsAsync(existing);

		// Act
		ApplicationRecord? result = await _service.UpdateAsync(1, updatedFields, TestUserId);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("Acme Corp", result.CompanyName);
		Assert.Equal(ApplicationStatus.Interviewing, result.Status);
		_repositoryMock.Verify(r => r.Update(existing), Times.Once);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task UpdateAsync_WhenNotFound_ReturnsNull() {
		// Arrange
		ApplicationRecord updatedFields = new() { CompanyName = "Ghost" };
		_repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ApplicationRecord? result = await _service.UpdateAsync(99, updatedFields, TestUserId);

		// Assert
		Assert.Null(result);
		_repositoryMock.Verify(r => r.Update(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task UpdateStatusAsync_WhenFound_UpdatesOnlyStatus() {
		// Arrange
		ApplicationRecord existing = new() {
			Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Applied, Notes = "Original notes"
		};
		_repositoryMock.Setup(r => r.GetByIdAsync(1, TestUserId)).ReturnsAsync(existing);

		// Act
		ApplicationRecord? result = await _service.UpdateStatusAsync(1, ApplicationStatus.Interviewing, TestUserId);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(ApplicationStatus.Interviewing, result.Status);
		Assert.Equal("Acme", result.CompanyName);
		Assert.Equal("Original notes", result.Notes);
		_repositoryMock.Verify(r => r.Update(existing), Times.Once);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task UpdateStatusAsync_WhenNotFound_ReturnsNull() {
		// Arrange
		_repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ApplicationRecord? result = await _service.UpdateStatusAsync(99, ApplicationStatus.Rejected, TestUserId);

		// Assert
		Assert.Null(result);
		_repositoryMock.Verify(r => r.Update(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task DeleteAsync_WhenFound_DeletesAndReturnsTrue() {
		// Arrange
		ApplicationRecord existing = new() { Id = 1, CompanyName = "Acme" };
		_repositoryMock.Setup(r => r.GetByIdAsync(1, TestUserId)).ReturnsAsync(existing);

		// Act
		bool result = await _service.DeleteAsync(1, TestUserId);

		// Assert
		Assert.True(result);
		_repositoryMock.Verify(r => r.Delete(existing), Times.Once);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task DeleteAsync_WhenNotFound_ReturnsFalse() {
		// Arrange
		_repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		bool result = await _service.DeleteAsync(99, TestUserId);

		// Assert
		Assert.False(result);
		_repositoryMock.Verify(r => r.Delete(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ExportAsync_DelegatesToRepositoryAndReturnsNonEmptyBytes() {
		// Arrange
		List<ApplicationRecord> records = [
			new() {
				CompanyName = "Acme",
				Status = ApplicationStatus.Applied,
				AppliedDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
				PostingUrl = "https://acme.example.com",
				Notes = "Applied via LinkedIn"
			},
			new() {
				CompanyName = "Globex",
				Status = ApplicationStatus.Interviewing,
				AppliedDate = null,
				PostingUrl = null,
				Notes = null
			},
		];
		_repositoryMock
			.Setup(r => r.GetAllForExportAsync(TestUserId))
			.ReturnsAsync(records);

		// Act
		byte[] result = await _service.ExportAsync(TestUserId);

		// Assert
		Assert.NotEmpty(result);
		_repositoryMock.Verify(r => r.GetAllForExportAsync(TestUserId), Times.Once);
	}
}
