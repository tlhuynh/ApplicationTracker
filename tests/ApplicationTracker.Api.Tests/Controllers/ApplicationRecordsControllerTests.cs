using ApplicationTracker.Api.Controllers;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ApplicationTracker.Shared.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;

namespace ApplicationTracker.Api.Tests.Controllers;

/// <summary>
/// Unit tests for <see cref="ApplicationRecordsController"/>.
/// </summary>
public class ApplicationRecordsControllerTests {
	private const string TestUserId = "test-user-id";
	private readonly Mock<IApplicationRecordService> _applicationRecordServiceMock;
	private readonly Mock<IExcelImportService> _excelImportServiceMock;
	private readonly ApplicationRecordsController _controller;

	public ApplicationRecordsControllerTests() {
		_applicationRecordServiceMock = new Mock<IApplicationRecordService>();
		_excelImportServiceMock = new Mock<IExcelImportService>();
		_controller = new ApplicationRecordsController(_applicationRecordServiceMock.Object,
			_excelImportServiceMock.Object);
		SetupUserClaims();
	}

	/// <summary>
	/// Configures the controller's HttpContext with a fake authenticated user.
	/// </summary>
	private void SetupUserClaims() {
		List<Claim> claims = [new Claim(ClaimTypes.NameIdentifier, TestUserId)];
		ClaimsIdentity identity = new(claims, "TestAuth");
		ClaimsPrincipal principal = new(identity);
		_controller.ControllerContext = new ControllerContext {
			HttpContext = new DefaultHttpContext { User = principal }
		};
	}

	[Fact]
	public async Task GetAll_ReturnsOkWithList() {
		// Arrange
		List<ApplicationRecord> records = [
			new() { Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Applied }
		];
		_applicationRecordServiceMock.Setup(s => s.GetAllAsync(TestUserId)).ReturnsAsync(records);

		// Act
		ActionResult<List<ApplicationRecordDto>> result = await _controller.GetAll();

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		List<ApplicationRecordDto> dtos = Assert.IsType<List<ApplicationRecordDto>>(okResult.Value);
		Assert.Single(dtos);
		Assert.Equal("Acme", dtos[0].CompanyName);
	}

	[Fact]
	public async Task GetById_WhenFound_ReturnsOk() {
		// Arrange
		ApplicationRecord record = new() { Id = 1, CompanyName = "Acme" };
		_applicationRecordServiceMock.Setup(s => s.GetByIdAsync(1, TestUserId)).ReturnsAsync(record);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.GetById(1);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ApplicationRecordDto dto = Assert.IsType<ApplicationRecordDto>(okResult.Value);
		Assert.Equal("Acme", dto.CompanyName);
	}

	[Fact]
	public async Task GetById_WhenNotFound_ReturnsNotFound() {
		// Arrange
		_applicationRecordServiceMock.Setup(s =>
			s.GetByIdAsync(99, TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.GetById(99);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task Create_ReturnsCreatedAtAction() {
		// Arrange
		CreateApplicationRecordRequest request = new() { CompanyName = "Acme", Status = ApplicationStatus.Applied };
		ApplicationRecord created = new() { Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Applied };
		_applicationRecordServiceMock.Setup(s =>
			s.CreateAsync(It.IsAny<ApplicationRecord>(), TestUserId)).ReturnsAsync(created);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.Create(request);

		// Assert
		CreatedAtActionResult createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
		Assert.Equal(201, createdResult.StatusCode);
		Assert.Equal(nameof(ApplicationRecordsController.GetById), createdResult.ActionName);
		ApplicationRecordDto dto = Assert.IsType<ApplicationRecordDto>(createdResult.Value);
		Assert.Equal("Acme", dto.CompanyName);
	}

	[Fact]
	public async Task Update_WhenFound_ReturnsOk() {
		// Arrange
		UpdateApplicationRecordRequest request = new() {
			CompanyName = "Acme Corp", Status = ApplicationStatus.Interviewing
		};
		ApplicationRecord updated = new() {
			Id = 1,
			CompanyName = "Acme Corp",
			Status =
				ApplicationStatus.Interviewing
		};
		_applicationRecordServiceMock.Setup(s =>
			s.UpdateAsync(1, It.IsAny<ApplicationRecord>(), TestUserId)).ReturnsAsync(updated);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.Update(1, request);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ApplicationRecordDto dto = Assert.IsType<ApplicationRecordDto>(okResult.Value);
		Assert.Equal("Acme Corp", dto.CompanyName);
	}

	[Fact]
	public async Task Update_WhenNotFound_ReturnsNotFound() {
		// Arrange
		UpdateApplicationRecordRequest request = new() { CompanyName = "Ghost" };
		_applicationRecordServiceMock.Setup(s => s.UpdateAsync(99,
			It.IsAny<ApplicationRecord>(), TestUserId)).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.Update(99, request);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task PatchStatus_WhenFound_ReturnsOkWithUpdatedDto() {
		// Arrange
		PatchStatusRequest request = new() { Status = ApplicationStatus.Interviewing };
		ApplicationRecord updated = new() { Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Interviewing };
		_applicationRecordServiceMock
			.Setup(s => s.UpdateStatusAsync(1, ApplicationStatus.Interviewing, TestUserId))
			.ReturnsAsync(updated);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.PatchStatus(1, request);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ApplicationRecordDto dto = Assert.IsType<ApplicationRecordDto>(okResult.Value);
		Assert.Equal("Acme", dto.CompanyName);
		Assert.Equal(ApplicationStatus.Interviewing, dto.Status);
	}

	[Fact]
	public async Task PatchStatus_WhenNotFound_ReturnsNotFound() {
		// Arrange
		PatchStatusRequest request = new() { Status = ApplicationStatus.Rejected };
		_applicationRecordServiceMock
			.Setup(s => s.UpdateStatusAsync(99, ApplicationStatus.Rejected, TestUserId))
			.ReturnsAsync((ApplicationRecord?)null);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.PatchStatus(99, request);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task Delete_WhenFound_ReturnsNoContent() {
		// Arrange
		_applicationRecordServiceMock.Setup(s => s.DeleteAsync(1, TestUserId)).ReturnsAsync(true);

		// Act
		IActionResult result = await _controller.Delete(1);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task Delete_WhenNotFound_ReturnsNotFound() {
		// Arrange
		_applicationRecordServiceMock.Setup(s => s.DeleteAsync(99, TestUserId)).ReturnsAsync(false);

		// Act
		IActionResult result = await _controller.Delete(99);

		// Assert
		Assert.IsType<NotFoundResult>(result);
	}

	[Fact]
	public async Task Import_WithValidFile_ReturnsOk() {
		// Arrange
		ExcelImportResult importResult = new() {
			TotalRows = 3,
			ImportedCount = 2,
			FailedCount = 1,
			Errors = [
				new() { RowNumber = 4, CompanyName = "Bad Corp", ErrorMessage = "Invalid Status." }
			]
		};
		_excelImportServiceMock.Setup(s =>
			s.ImportAsync(It.IsAny<Stream>(), TestUserId)).ReturnsAsync(importResult);

		Mock<IFormFile> fileMock = new();
		fileMock.Setup(f => f.FileName).Returns("import.xlsx");
		fileMock.Setup(f => f.Length).Returns(1024);
		fileMock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream());

		// Act
		ActionResult<ExcelImportResultDto> result = await _controller.Import(fileMock.Object);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ExcelImportResultDto dto = Assert.IsType<ExcelImportResultDto>(okResult.Value);
		Assert.Equal(3, dto.TotalRows);
		Assert.Equal(2, dto.ImportedCount);
		Assert.Equal(1, dto.FailedCount);
		Assert.Single(dto.Errors);
	}

	[Fact]
	public async Task Import_WithInvalidExtension_ReturnsBadRequest() {
		// Arrange
		Mock<IFormFile> fileMock = new();
		fileMock.Setup(f => f.FileName).Returns("import.csv");
		fileMock.Setup(f => f.Length).Returns(1024);

		// Act
		ActionResult<ExcelImportResultDto> result = await _controller.Import(fileMock.Object);

		// Assert
		BadRequestObjectResult badResult = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal("Only .xlsx files are supported.", badResult.Value);
		_excelImportServiceMock.Verify(s => s.ImportAsync(It.IsAny<Stream>(), It.IsAny<string>()), Times.Never);
	}
}
