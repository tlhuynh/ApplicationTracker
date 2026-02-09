using ApplicationTracker.Api.Controllers;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Shared.DTOs;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ApplicationTracker.Api.Tests.Controllers;

/// <summary>
/// Unit tests for <see cref="ApplicationRecordsController"/>.
/// </summary>
public class ApplicationRecordsControllerTests {
	private readonly Mock<IApplicationRecordService> _serviceMock;
	private readonly ApplicationRecordsController _controller;

	public ApplicationRecordsControllerTests() {
		_serviceMock = new Mock<IApplicationRecordService>();
		_controller = new ApplicationRecordsController(_serviceMock.Object);
	}

	[Fact]
	public async Task GetAll_ReturnsOkWithList() {
		// Arrange
		List<ApplicationRecord> records = [
			new() { Id = 1, CompanyName = "Acme", Status = ApplicationStatus.Applied }
		];
		_serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(records);

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
		_serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(record);

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
		_serviceMock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((ApplicationRecord?)null);

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
		_serviceMock.Setup(s => s.CreateAsync(It.IsAny<ApplicationRecord>())).ReturnsAsync(created);

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
		_serviceMock.Setup(s => s.UpdateAsync(1, It.IsAny<ApplicationRecord>())).ReturnsAsync(updated);

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
		_serviceMock.Setup(s => s.UpdateAsync(99,
			It.IsAny<ApplicationRecord>())).ReturnsAsync((ApplicationRecord?)null);

		// Act
		ActionResult<ApplicationRecordDto> result = await _controller.Update(99, request);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task Delete_WhenFound_ReturnsNoContent() {
		// Arrange
		_serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

		// Act
		IActionResult result = await _controller.Delete(1);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task Delete_WhenNotFound_ReturnsNotFound() {
		// Arrange
		_serviceMock.Setup(s => s.DeleteAsync(99)).ReturnsAsync(false);

		// Act
		IActionResult result = await _controller.Delete(99);

		// Assert
		Assert.IsType<NotFoundResult>(result);
	}
}
