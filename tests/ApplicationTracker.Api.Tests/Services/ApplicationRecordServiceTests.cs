using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using Moq;

namespace ApplicationTracker.Api.Tests.Services;

/// <summary>
/// Unit tests for <see cref="ApplicationRecordService"/>.
/// </summary>
public class ApplicationRecordServiceTests {
	private readonly Mock<IApplicationRecordRepository> _repositoryMock;
	private readonly ApplicationRecordService _service;

	public ApplicationRecordServiceTests() {
		_repositoryMock = new Mock<IApplicationRecordRepository>();
		_service = new ApplicationRecordService(_repositoryMock.Object);
	}

	[Fact]
	public async Task GetAllAsync_ReturnsAllRecords() {
		// Arrange
		List<ApplicationRecord> records = [
			new() { Id = 1, CompanyName = "Acme" },
			new() { Id = 2, CompanyName = "Globex" }
		];
		_repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(records);

		// Act
		List<ApplicationRecord> result = await _service.GetAllAsync();

		// Assert
		Assert.Equal(2, result.Count);
		Assert.Equal("Acme", result[0].CompanyName);
		Assert.Equal("Globex", result[1].CompanyName);
	}

	[Fact]
	public async Task GetByIdAsync_WhenFound_ReturnsRecord() {
		// Arrange
		ApplicationRecord record = new() { Id = 1, CompanyName = "Acme" };
		_repositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(record);

		// Act
		ApplicationRecord? result = await _service.GetByIdAsync(1);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("Acme", result.CompanyName);
	}

	[Fact]
	public async Task GetByIdAsync_WhenNotFound_ReturnsNull() {
		// Arrange
		_repositoryMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ApplicationRecord? result = await _service.GetByIdAsync(99);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task CreateAsync_AddsEntityAndSavesChanges() {
		// Arrange
		ApplicationRecord entity = new() { CompanyName = "Acme", Status = ApplicationStatus.Applied };

		// Act
		ApplicationRecord result = await _service.CreateAsync(entity);

		// Assert
		Assert.Equal("Acme", result.CompanyName);
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
		_repositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existing);

		// Act
		ApplicationRecord? result = await _service.UpdateAsync(1, updatedFields);

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
		_repositoryMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ApplicationRecord? result = await _service.UpdateAsync(99, updatedFields);

		// Assert
		Assert.Null(result);
		_repositoryMock.Verify(r => r.Update(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task DeleteAsync_WhenFound_DeletesAndReturnsTrue() {
		// Arrange
		ApplicationRecord existing = new() { Id = 1, CompanyName = "Acme" };
		_repositoryMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existing);

		// Act
		bool result = await _service.DeleteAsync(1);

		// Assert
		Assert.True(result);
		_repositoryMock.Verify(r => r.Delete(existing), Times.Once);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task DeleteAsync_WhenNotFound_ReturnsFalse() {
		// Arrange
		_repositoryMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		bool result = await _service.DeleteAsync(99);

		// Assert
		Assert.False(result);
		_repositoryMock.Verify(r => r.Delete(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}
}
