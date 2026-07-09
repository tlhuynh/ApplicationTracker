using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using Moq;

namespace ApplicationTracker.Api.Tests.Services;

/// <summary>
/// Unit tests for <see cref="InterviewService"/>.
/// </summary>
public class InterviewServiceTests {
    private const string TestUserId = "test-user-id";
    private readonly Mock<IInterviewRepository> _repositoryMock;
    private readonly InterviewService _service;

    public InterviewServiceTests() {
        _repositoryMock = new Mock<IInterviewRepository>();
        _service = new InterviewService(_repositoryMock.Object);
    }

    // ── GetAllAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_WhenApplicationBelongsToUser_ReturnsInterviews() {
        // Arrange
        List<Interview> interviews = [
            new() { Id = 1, ApplicationRecordId = 5, Type = InterviewType.Screening, Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc) }
        ];
        _repositoryMock.Setup(r => r.ApplicationRecordBelongsToUserAsync(5, TestUserId)).ReturnsAsync(true);
        _repositoryMock.Setup(r => r.GetByApplicationRecordIdAsync(5, TestUserId)).ReturnsAsync(interviews);

        // Act
        List<Interview>? result = await _service.GetAllAsync(5, TestUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(InterviewType.Screening, result[0].Type);
        _repositoryMock.Verify(r => r.GetByApplicationRecordIdAsync(5, TestUserId), Times.Once);
    }

    [Fact]
    public async Task GetAllAsync_WhenApplicationNotBelongsToUser_ReturnsNull() {
        // Arrange
        _repositoryMock.Setup(r => r.ApplicationRecordBelongsToUserAsync(99, TestUserId)).ReturnsAsync(false);

        // Act
        List<Interview>? result = await _service.GetAllAsync(99, TestUserId);

        // Assert
        Assert.Null(result);
        _repositoryMock.Verify(r => r.GetByApplicationRecordIdAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    // ── CreateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_WhenApplicationBelongsToUser_SetsFieldsAndSaves() {
        // Arrange
        Interview entity = new() { Type = InterviewType.Technical, Date = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc) };
        _repositoryMock.Setup(r => r.ApplicationRecordBelongsToUserAsync(5, TestUserId)).ReturnsAsync(true);

        // Act
        Interview? result = await _service.CreateAsync(5, entity, TestUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.ApplicationRecordId);
        Assert.Equal(TestUserId, result.UserId);
        _repositoryMock.Verify(r => r.AddAsync(entity), Times.Once);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenApplicationNotBelongsToUser_ReturnsNull() {
        // Arrange
        Interview entity = new() { Type = InterviewType.Screening, Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc) };
        _repositoryMock.Setup(r => r.ApplicationRecordBelongsToUserAsync(99, TestUserId)).ReturnsAsync(false);

        // Act
        Interview? result = await _service.CreateAsync(99, entity, TestUserId);

        // Assert
        Assert.Null(result);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Interview>()), Times.Never);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    // ── UpdateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_WhenFound_UpdatesAllFieldsAndSaves() {
        // Arrange
        Interview existing = new() {
            Id = 3,
            ApplicationRecordId = 5,
            Type = InterviewType.Screening,
            Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            UserId = TestUserId
        };
        Interview updatedFields = new() {
            Type = InterviewType.Technical,
            RoundNumber = 2,
            Date = new DateTime(2025, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            Outcome = InterviewOutcome.Passed,
            Notes = "Went well"
        };
        _repositoryMock.Setup(r => r.GetByIdAsync(3, TestUserId)).ReturnsAsync(existing);

        // Act
        Interview? result = await _service.UpdateAsync(5, 3, updatedFields, TestUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(InterviewType.Technical, result.Type);
        Assert.Equal(2, result.RoundNumber);
        Assert.Equal(InterviewOutcome.Passed, result.Outcome);
        Assert.Equal("Went well", result.Notes);
        _repositoryMock.Verify(r => r.Update(existing), Times.Once);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsNull() {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((Interview?)null);

        // Act
        Interview? result = await _service.UpdateAsync(5, 99, new Interview(), TestUserId);

        // Assert
        Assert.Null(result);
        _repositoryMock.Verify(r => r.Update(It.IsAny<Interview>()), Times.Never);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WhenInterviewBelongsToDifferentApplication_ReturnsNull() {
        // Arrange — interview exists but under applicationRecordId=7, not 5
        Interview existing = new() { Id = 3, ApplicationRecordId = 7, Type = InterviewType.Screening, Date = DateTime.UtcNow };
        _repositoryMock.Setup(r => r.GetByIdAsync(3, TestUserId)).ReturnsAsync(existing);

        // Act
        Interview? result = await _service.UpdateAsync(5, 3, new Interview(), TestUserId);

        // Assert
        Assert.Null(result);
        _repositoryMock.Verify(r => r.Update(It.IsAny<Interview>()), Times.Never);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    // ── DeleteAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_WhenFound_DeletesAndReturnsTrue() {
        // Arrange
        Interview existing = new() { Id = 3, ApplicationRecordId = 5, Type = InterviewType.Screening, Date = DateTime.UtcNow };
        _repositoryMock.Setup(r => r.GetByIdAsync(3, TestUserId)).ReturnsAsync(existing);

        // Act
        bool result = await _service.DeleteAsync(5, 3, TestUserId);

        // Assert
        Assert.True(result);
        _repositoryMock.Verify(r => r.Delete(existing), Times.Once);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse() {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(99, TestUserId)).ReturnsAsync((Interview?)null);

        // Act
        bool result = await _service.DeleteAsync(5, 99, TestUserId);

        // Assert
        Assert.False(result);
        _repositoryMock.Verify(r => r.Delete(It.IsAny<Interview>()), Times.Never);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_WhenInterviewBelongsToDifferentApplication_ReturnsFalse() {
        // Arrange — interview exists but under applicationRecordId=7, not 5
        Interview existing = new() { Id = 3, ApplicationRecordId = 7, Type = InterviewType.Screening, Date = DateTime.UtcNow };
        _repositoryMock.Setup(r => r.GetByIdAsync(3, TestUserId)).ReturnsAsync(existing);

        // Act
        bool result = await _service.DeleteAsync(5, 3, TestUserId);

        // Assert
        Assert.False(result);
        _repositoryMock.Verify(r => r.Delete(It.IsAny<Interview>()), Times.Never);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }
}