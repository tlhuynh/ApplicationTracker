using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ApplicationTracker.Shared.DTOs;
using ApplicationTracker.Shared.Mappings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace ApplicationTracker.Api.Controllers;

/// <summary>
/// REST API controller for managing application records.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApplicationRecordsController(
	IApplicationRecordService service,
	IExcelImportService excelImportService,
	IConfiguration configuration) : ControllerBase {
	private readonly long _maxExcelUploadBytes = configuration.GetValue<long?>("App:MaxExcelUploadBytes") ?? 5_242_880;

	/// <summary>
	/// Resolves the authenticated user's identifier from the JWT claims.
	/// </summary>
	private bool TryGetUserId(out string userId) {
		string? id = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (string.IsNullOrEmpty(id)) {
			userId = string.Empty;
			return false;
		}

		userId = id;
		return true;
	}

	/// <summary>
	/// Validates extension and size for Excel uploads.
	/// </summary>
	private bool TryValidateExcelFile(IFormFile file, out string errorMessage) {
		if (file.Length == 0) {
			errorMessage = "No file uploaded.";
			return false;
		}

		if (file.Length > _maxExcelUploadBytes) {
			long maxMb = _maxExcelUploadBytes / (1024 * 1024);
			errorMessage = $"File exceeds maximum size of {maxMb} MB.";
			return false;
		}

		string extension = Path.GetExtension(file.FileName);
		if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase)) {
			errorMessage = "Only .xlsx files are supported.";
			return false;
		}

		errorMessage = string.Empty;
		return true;
	}

	/// <summary>
	/// Retrieves all application records.
	/// </summary>
	[HttpGet]
	public async Task<ActionResult<List<ApplicationRecordDto>>> GetAll() {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		List<ApplicationRecord> records = await service.GetAllAsync(userId);
		List<ApplicationRecordDto> dtos = records.Select(r => r.ToDto()).ToList();
		return Ok(dtos);
	}

	/// <summary>
	/// Retrieves a single application record by its identifier.
	/// </summary>
	/// <param name="id">The record identifier.</param>
	[HttpGet("{id:int}")]
	public async Task<ActionResult<ApplicationRecordDto>> GetById(int id) {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		ApplicationRecord? record = await service.GetByIdAsync(id, userId);
		if (record is null) {
			return NotFound();
		}

		return Ok(record.ToDto());
	}

	/// <summary>
	/// Creates a new application record.
	/// </summary>
	/// <param name="request">The creation request.</param>
	[HttpPost]
	public async Task<ActionResult<ApplicationRecordDto>> Create(CreateApplicationRecordRequest request) {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		ApplicationRecord entity = request.ToEntity();
		ApplicationRecord created = await service.CreateAsync(entity, userId);
		ApplicationRecordDto dto = created.ToDto();
		return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
	}

	/// <summary>
	/// Updates an existing application record.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="request">The update request.</param>
	[HttpPut("{id:int}")]
	public async Task<ActionResult<ApplicationRecordDto>> Update(int id, UpdateApplicationRecordRequest request) {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		ApplicationRecord updatedFields = new() {
			CompanyName = request.CompanyName,
			Status = request.Status,
			AppliedDate = request.AppliedDate,
			PostingUrl = request.PostingUrl,
			Notes = request.Notes
		};

		ApplicationRecord? updated = await service.UpdateAsync(id, updatedFields, userId);
		if (updated is null) {
			return NotFound();
		}

		return Ok(updated.ToDto());
	}

	/// <summary>
	/// Updates only the status of an existing application record.
	/// </summary>
	/// <param name="id">The identifier of the record to update.</param>
	/// <param name="request">The patch request containing the new status.</param>
	[HttpPatch("{id:int}/status")]
	public async Task<ActionResult<ApplicationRecordDto>> PatchStatus(int id, PatchStatusRequest request) {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		ApplicationRecord? updated = await service.UpdateStatusAsync(id, request.Status, userId);
		if (updated is null) {
			return NotFound();
		}

		return Ok(updated.ToDto());
	}

	/// <summary>
	/// Soft-deletes an application record.
	/// </summary>
	/// <param name="id">The identifier of the record to delete.</param>
	[HttpDelete("{id:int}")]
	public async Task<IActionResult> Delete(int id) {
		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		bool deleted = await service.DeleteAsync(id, userId);
		if (!deleted) {
			return NotFound();
		}

		return NoContent();
	}

	/// <summary>
	/// Imports application records from an Excel file.
	/// Skips invalid rows and returns a detailed import report.
	/// </summary>
	/// <param name="file">The .xlsx file to import.</param>
	[HttpPost("import")]
	public async Task<ActionResult<ExcelImportResultDto>> Import(IFormFile file) {
		if (!TryValidateExcelFile(file, out string validationError)) {
			return BadRequest(validationError);
		}

		if (!TryGetUserId(out string userId)) {
			return Unauthorized();
		}
		await using Stream stream = file.OpenReadStream();
		ExcelImportResult result = await excelImportService.ImportAsync(stream, userId);
		return Ok(result.ToDto());
	}

	/// <summary>
	/// Parses and validates an Excel file without saving to the database.
	/// Intended for demo mode — returns the parsed rows so the client can store them locally.
	/// </summary>
	/// <param name="file">The .xlsx file to parse.</param>
	[AllowAnonymous]
	[HttpPost("parse")]
	public async Task<ActionResult<ParseExcelResultDto>> Parse(IFormFile file) {
		if (!TryValidateExcelFile(file, out string validationError)) {
			return BadRequest(validationError);
		}

		await using Stream stream = file.OpenReadStream();
		ParseExcelResult result = await excelImportService.ParseAsync(stream);
		return Ok(result.ToDto());
	}
}
