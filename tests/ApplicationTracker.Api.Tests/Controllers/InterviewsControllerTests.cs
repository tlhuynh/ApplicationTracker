using ApplicationTracker.Api.Controllers;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Shared.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace ApplicationTracker.Api.Tests.Controllers;

/// <summary>
/// Unit tests for <see cref="InterviewsController"/>.
/// </summary>
public class InterviewsControllerTests {
    private const string TestUserId = "test-user-id";
    private readonly Mock<IInterviewService> _serviceMock;
    private readonly InterviewsController _controller;

    public InterviewsControllerTests() {
        _serviceMock = new Mock<IInterviewService>();
        _controller = new InterviewsController(_serviceMock.Object);
        SetupUserClaims();
    }

    private void SetupUserClaims() {
        List<Claim> claims = [new Claim(ClaimTypes.NameIdentifier, TestUserId)];
        ClaimsIdentity identity = new(claims, "TestAuth");
        ClaimsPrincipal principal = new(identity);
        _controller.ControllerContext = new ControllerContext {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task GetAll_WhenApplicationFound_ReturnsOkWithList() {
        // Arrange
        List<Interview> interviews = [
            new() {
                Id = 1,
                ApplicationRecordId = 5,
                Type = InterviewType.Screening,
                Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        ];
        _serviceMock.Setup(s => s.GetAllAsync(5, TestUserId)).ReturnsAsync(interviews);

        // Act
        ActionResult<List<InterviewDto>> result = await _controller.GetAll(5);

        // Assert
        OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
        List<InterviewDto> dtos = Assert.IsType<List<InterviewDto>>(ok.Value);
        Assert.Single(dtos);
        Assert.Equal(InterviewType.Screening, dtos[0].Type);
    }

    [Fact]
    public async Task GetAll_WhenApplicationNotFound_ReturnsNotFound() {
        // Arrange
        _serviceMock.Setup(s => s.GetAllAsync(99, TestUserId)).ReturnsAsync((List<Interview>?)null);

        // Act
        ActionResult<List<InterviewDto>> result = await _controller.GetAll(99);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_WhenApplicationFound_ReturnsCreatedAtAction() {
        // Arrange
        CreateInterviewRequest request = new() {
            Type = InterviewType.Technical,
            Date = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc)
        };
        Interview created = new() {
            Id = 1,
            ApplicationRecordId = 5,
            Type = InterviewType.Technical,
            Date = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc)
        };
        _serviceMock.Setup(s => s.CreateAsync(5, It.IsAny<Interview>(), TestUserId)).ReturnsAsync(created);

        // Act
        ActionResult<InterviewDto> result = await _controller.Create(5, request);

        // Assert
        CreatedAtActionResult createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdResult.StatusCode);
        Assert.Equal(nameof(InterviewsController.GetAll), createdResult.ActionName);
        InterviewDto dto = Assert.IsType<InterviewDto>(createdResult.Value);
        Assert.Equal(InterviewType.Technical, dto.Type);
    }

    [Fact]
    public async Task Create_WhenApplicationNotFound_ReturnsNotFound() {
        // Arrange
        CreateInterviewRequest request = new() {
            Type = InterviewType.Screening,
            Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        _serviceMock.Setup(s => s.CreateAsync(99, It.IsAny<Interview>(), TestUserId)).ReturnsAsync((Interview?)null);

        // Act
        ActionResult<InterviewDto> result = await _controller.Create(99, request);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenFound_ReturnsOk() {
        // Arrange
        UpdateInterviewRequest request = new() {
            Type = InterviewType.Onsite,
            Date = new DateTime(2025, 4, 10, 0, 0, 0, DateTimeKind.Utc),
            RoundNumber = 2
        };
        Interview updated = new() {
            Id = 3,
            ApplicationRecordId = 5,
            Type = InterviewType.Onsite,
            Date = new DateTime(2025, 4, 10, 0, 0, 0, DateTimeKind.Utc),
            RoundNumber = 2
        };
        _serviceMock.Setup(s => s.UpdateAsync(5, 3, It.IsAny<Interview>(), TestUserId)).ReturnsAsync(updated);

        // Act
        ActionResult<InterviewDto> result = await _controller.Update(5, 3, request);

        // Assert
        OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
        InterviewDto dto = Assert.IsType<InterviewDto>(ok.Value);
        Assert.Equal(InterviewType.Onsite, dto.Type);
        Assert.Equal(2, dto.RoundNumber);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound() {
        // Arrange
        UpdateInterviewRequest request = new() {
            Type = InterviewType.Screening,
            Date = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        _serviceMock.Setup(s => s.UpdateAsync(5, 99, It.IsAny<Interview>(), TestUserId)).ReturnsAsync((Interview?)null);

        // Act
        ActionResult<InterviewDto> result = await _controller.Update(5, 99, request);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Delete_WhenFound_ReturnsNoContent() {
        // Arrange
        _serviceMock.Setup(s => s.DeleteAsync(5, 3, TestUserId)).ReturnsAsync(true);

        // Act
        IActionResult result = await _controller.Delete(5, 3);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsNotFound() {
        // Arrange
        _serviceMock.Setup(s => s.DeleteAsync(5, 99, TestUserId)).ReturnsAsync(false);

        // Act
        IActionResult result = await _controller.Delete(5, 99);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }
}