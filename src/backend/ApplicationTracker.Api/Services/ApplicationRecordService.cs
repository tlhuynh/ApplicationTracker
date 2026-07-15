using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ClosedXML.Excel;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Service implementation for application record business logic.
/// Orchestrates repository calls and applies domain rules.
/// </summary>
public class ApplicationRecordService(IApplicationRecordRepository repository, IInterviewRepository interviewRepository) : IApplicationRecordService {
	/// <inheritdoc />
	public async Task<PagedResult<ApplicationRecord>> GetPagedAsync(
		string userId, int page, int pageSize, string sortBy, string sortDir,
		string? search, List<ApplicationStatus>? statuses, DateTime? dateFrom, DateTime? dateTo) {
		return await repository.GetPagedAsync(userId, page, pageSize, sortBy, sortDir, search, statuses, dateFrom, dateTo);
	}

	/// <inheritdoc />
	public async Task<ApplicationRecord?> GetByIdAsync(int id, string userId) {
		return await repository.GetByIdAsync(id, userId);
	}

	/// <inheritdoc />
	public async Task<ApplicationRecord> CreateAsync(ApplicationRecord entity, string userId) {
		entity.UserId = userId;
		await repository.AddAsync(entity);
		await repository.SaveChangesAsync();
		return entity;
	}

	/// <inheritdoc />
	public async Task<ApplicationRecord?> UpdateAsync(int id, ApplicationRecord updatedFields, string userId) {
		ApplicationRecord? existing = await repository.GetByIdAsync(id, userId);
		if (existing is null) {
			return null;
		}

		existing.CompanyName = updatedFields.CompanyName;
		existing.Status = updatedFields.Status;
		existing.AppliedDate = updatedFields.AppliedDate;
		existing.PostingUrl = updatedFields.PostingUrl;
		existing.Notes = updatedFields.Notes;

		repository.Update(existing);
		await repository.SaveChangesAsync();
		return existing;
	}

	/// <inheritdoc />
	public async Task<ApplicationRecord?> UpdateStatusAsync(int id, ApplicationStatus status, string userId) {
		ApplicationRecord? existing = await repository.GetByIdAsync(id, userId);
		if (existing is null) {
			return null;
		}

		existing.Status = status;
		repository.Update(existing);
		await repository.SaveChangesAsync();
		return existing;
	}

	/// <inheritdoc />
	public async Task<bool> DeleteAsync(int id, string userId) {
		ApplicationRecord? existing = await repository.GetByIdAsync(id, userId);
		if (existing is null) {
			return false;
		}

		await interviewRepository.DeleteAllByApplicationRecordIdAsync(id);
		repository.Delete(existing);
		await repository.SaveChangesAsync();
		return true;
	}

	/// <inheritdoc />
	public async Task<byte[]> ExportAsync(string userId) {
		List<ApplicationRecord> records = await repository.GetAllForExportAsync(userId);

		using XLWorkbook workbook = new();
		IXLWorksheet sheet = workbook.AddWorksheet("Data");

		sheet.Cell(1, 1).Value = "CompanyName";
		sheet.Cell(1, 2).Value = "Status";
		sheet.Cell(1, 3).Value = "AppliedDate";
		sheet.Cell(1, 4).Value = "PostingUrl";
		sheet.Cell(1, 5).Value = "Notes";

		for (int i = 0; i < records.Count; i++) {
			ApplicationRecord r = records[i];
			int row = i + 2;
			sheet.Cell(row, 1).Value = r.CompanyName;
			sheet.Cell(row, 2).Value = r.Status.ToString();
			sheet.Cell(row, 3).Value = r.AppliedDate.HasValue
				? r.AppliedDate.Value.ToString("yyyy-MM-dd")
				: string.Empty;
			sheet.Cell(row, 4).Value = r.PostingUrl ?? string.Empty;
			sheet.Cell(row, 5).Value = r.Notes ?? string.Empty;
		}

		using MemoryStream stream = new();
		workbook.SaveAs(stream);
		return stream.ToArray();
	}

	/// <inheritdoc />
	public async Task<(bool Found, string? Description)> GetDescriptionAsync(int id, string userId) {
		return await repository.GetDescriptionAsync(id, userId);
	}

	/// <inheritdoc />
	public async Task<bool> UpdateDescriptionAsync(int id, string? description, string userId) {
		return await repository.UpdateDescriptionAsync(id, description, userId);
	}
}
