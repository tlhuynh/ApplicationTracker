using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ClosedXML.Excel;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Service implementation for importing application records from Excel files.
/// Parses rows using ClosedXML, validates data, and saves valid records via the repository.
/// </summary>
public class ExcelImportService(IApplicationRecordRepository repository) : IExcelImportService {
	/// <inheritdoc />
	public async Task<ExcelImportResult> ImportAsync(Stream fileStream) {
		using XLWorkbook workbook = new(fileStream);
		IXLWorksheet sheet = workbook.Worksheet(1);
		List<ExcelImportError> errors = [];
		int importedCount = 0;

		IEnumerable<IXLRow> dataRows = sheet.RowsUsed().Skip(1);
		int totalRows = dataRows.Count();

		foreach (IXLRow row in dataRows) {
			int rowNumber = row.RowNumber();
			string companyName = row.Cell(1).GetString().Trim();
			string statusText = row.Cell(2).GetString().Trim();

			// Validate CompanyName (required)
			if (string.IsNullOrWhiteSpace(companyName)) {
				errors.Add(new() {
					RowNumber = rowNumber, CompanyName = null, ErrorMessage = "CompanyName is required."
				});
				continue;
			}

			// Validate Status (required, must match enum)
			if (!Enum.TryParse(statusText, ignoreCase: true, out ApplicationStatus status)) {
				errors.Add(new() {
					RowNumber = rowNumber,
					CompanyName = companyName,
					ErrorMessage = $"Invalid Status '{statusText}'. Expected: {string.Join(", ",
						Enum.GetNames<ApplicationStatus>())}."
				});
				continue;
			}

			// Parse AppliedDate (optional)
			DateTime? appliedDate = null;
			string appliedDateText = row.Cell(3).GetString().Trim();
			if (!string.IsNullOrWhiteSpace(appliedDateText)) {
				if (DateTime.TryParse(appliedDateText, out DateTime parsed)) {
					appliedDate = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
				} else {
					errors.Add(new() {
						RowNumber = rowNumber,
						CompanyName = companyName,
						ErrorMessage = $"Invalid AppliedDate '{appliedDateText}'."
					});
					continue;
				}
			}

			// Read optional fields
			string? postingUrl = row.Cell(4).GetString().Trim();
			if (string.IsNullOrWhiteSpace(postingUrl)) {
				postingUrl = null;
			}

			string? notes = row.Cell(5).GetString().Trim();
			if (string.IsNullOrWhiteSpace(notes)) {
				notes = null;
			}

			ApplicationRecord entity = new() {
				CompanyName = companyName,
				Status = status,
				AppliedDate = appliedDate,
				PostingUrl = postingUrl,
				Notes = notes
			};

			await repository.AddAsync(entity);
			importedCount++;
		}

		if (importedCount > 0) {
			await repository.SaveChangesAsync();
		}

		return new() {
			TotalRows = totalRows, ImportedCount = importedCount, FailedCount = errors.Count, Errors = errors
		};
	}
}
