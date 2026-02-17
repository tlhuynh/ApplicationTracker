using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ApplicationTracker.Shared.DTOs;
using ApplicationTracker.Shared.Mappings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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
	IExcelImportService excelImportService) : ControllerBase {
	/// <summary>
	/// Extracts the authenticated user's identifier from the JWT claims.
	/// </summary>
	private string GetUserId() {
		return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
	}

	/// <summary>
	/// Retrieves all application records.
	/// </summary>
	[HttpGet]
	public async Task<ActionResult<List<ApplicationRecordDto>>> GetAll() {
		string userId = GetUserId();
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
		string userId = GetUserId();
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
		string userId = GetUserId();
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
		string userId = GetUserId();
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
		string userId = GetUserId();
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
		string userId = GetUserId();
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
		if (file.Length == 0) {
			return BadRequest("No file uploaded.");
		}

		string extension = Path.GetExtension(file.FileName);
		if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase)) {
			return BadRequest("Only .xlsx files are supported.");
		}

		string userId = GetUserId();
		await using Stream stream = file.OpenReadStream();
		ExcelImportResult result = await excelImportService.ImportAsync(stream, userId);
		return Ok(result.ToDto());
	}
}
