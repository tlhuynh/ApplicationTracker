using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Models;
using ClosedXML.Excel;
using Moq;

namespace ApplicationTracker.Api.Tests.Services;

/// <summary>
/// Unit tests for <see cref="ExcelImportService"/>.
/// </summary>
public class ExcelImportServiceTests {
	private readonly Mock<IApplicationRecordRepository> _repositoryMock;
	private readonly ExcelImportService _service;

	public ExcelImportServiceTests() {
		_repositoryMock = new Mock<IApplicationRecordRepository>();
		_service = new ExcelImportService(_repositoryMock.Object);
	}

	/// <summary>
	/// Creates an in-memory .xlsx stream with header row and optional data rows.
	/// Each row is a string array matching columns: CompanyName, Status, AppliedDate, PostingUrl, Notes.
	/// </summary>
	private static MemoryStream CreateExcelStream(params string[][] rows) {
		using XLWorkbook workbook = new();
		IXLWorksheet sheet = workbook.AddWorksheet("Sheet1");

		// Header row
		sheet.Cell(1, 1).Value = "CompanyName";
		sheet.Cell(1, 2).Value = "Status";
		sheet.Cell(1, 3).Value = "AppliedDate";
		sheet.Cell(1, 4).Value = "PostingUrl";
		sheet.Cell(1, 5).Value = "Notes";

		// Data rows
		for (int i = 0; i < rows.Length; i++) {
			for (int j = 0; j < rows[i].Length; j++) {
				sheet.Cell(i + 2, j + 1).Value = rows[i][j];
			}
		}

		MemoryStream stream = new();
		workbook.SaveAs(stream);
		stream.Position = 0;
		return stream;
	}

	[Fact]
	public async Task ImportAsync_WithValidRows_ImportsAllRecords() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "2025-01-15", "https://acme.com", "Great place"],
			["Globex", "Interviewing", "2025-01-15", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(2, result.TotalRows);
		Assert.Equal(2, result.ImportedCount);
		Assert.Equal(0, result.FailedCount);
		Assert.Empty(result.Errors);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Exactly(2));
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task ImportAsync_WithInvalidStatus_SkipsRowAndReportsError() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "InvalidStatus", "", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Equal(2, result.Errors[0].RowNumber);
		Assert.Equal("Acme", result.Errors[0].CompanyName);
		Assert.Contains("InvalidStatus", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithMissingCompanyName_SkipsRowAndReportsError() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["", "Applied", "", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("CompanyName is required", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithMixedRows_ImportsValidAndReportsInvalid() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "2025-01-15", "", ""],
			["", "Applied", "", "", ""],
			["Globex", "BadStatus", "", "", ""],
			["Initech", "Offered", "2025-03-01", "https://initech.com", "Nice"]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(4, result.TotalRows);
		Assert.Equal(2, result.ImportedCount);
		Assert.Equal(2, result.FailedCount);
		Assert.Equal(2, result.Errors.Count);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Exactly(2));
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
	}

	[Fact]
	public async Task ImportAsync_WithEmptySheet_ReturnsZeroCounts() {
		// Arrange — header only, no data rows
		await using MemoryStream stream = CreateExcelStream();

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(0, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(0, result.FailedCount);
		Assert.Empty(result.Errors);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithNumericStatus_SkipsRowAndReportsError() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "1", "2025-01-15", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("Invalid Status '1'", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithMissingAppliedDate_SkipsRowAndReportsError() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("AppliedDate is required", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithInvalidPostingUrl_SkipsRowAndReportsError() {
		// Arrange
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "2025-01-15", "not-a-url", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("Invalid PostingUrl", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
		_repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithDuplicateByPostingUrl_SkipsRowAndReportsError() {
		// Arrange
		_repositoryMock.Setup(r => r.ExistsAsync("Acme", It.IsAny<DateTime>(), "https://acme.com/jobs/1"))
			.ReturnsAsync(true);
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "2025-01-15", "https://acme.com/jobs/1", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("Duplicate application", result.Errors[0].ErrorMessage);
		Assert.Contains("posting URL", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
	}

	[Fact]
	public async Task ImportAsync_WithDuplicateByAppliedDate_SkipsRowAndReportsError() {
		// Arrange
		_repositoryMock.Setup(r => r.ExistsAsync("Acme", It.IsAny<DateTime>(), null))
			.ReturnsAsync(true);
		await using MemoryStream stream = CreateExcelStream(
			["Acme", "Applied", "2025-01-15", "", ""]
		);

		// Act
		ExcelImportResult result = await _service.ImportAsync(stream);

		// Assert
		Assert.Equal(1, result.TotalRows);
		Assert.Equal(0, result.ImportedCount);
		Assert.Equal(1, result.FailedCount);
		Assert.Single(result.Errors);
		Assert.Contains("Duplicate application", result.Errors[0].ErrorMessage);
		Assert.Contains("applied date", result.Errors[0].ErrorMessage);
		_repositoryMock.Verify(r => r.AddAsync(It.IsAny<ApplicationRecord>()), Times.Never);
	}
}
