using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Enums;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Core.Models;
using ClosedXML.Excel;
using System.Globalization;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Service implementation for importing application records from Excel files.
/// Parses rows using ClosedXML, validates data, and saves valid records via the repository.
/// </summary>
public class ExcelImportService(IApplicationRecordRepository repository) : IExcelImportService {
	/// <inheritdoc />
	public async Task<ExcelImportResult> ImportAsync(Stream fileStream, string userId) {
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
			string appliedDateText = row.Cell(3).GetString().Trim();

			// Validate CompanyName (required)
			if (string.IsNullOrWhiteSpace(companyName)) {
				errors.Add(new() {
					RowNumber = rowNumber, CompanyName = null, ErrorMessage = "CompanyName is required."
				});
				continue;
			}

			// Validate Status (required, must match enum, can't be numeric)
			if (int.TryParse(statusText, out _) ||
			    !Enum.TryParse(statusText, ignoreCase: true, out ApplicationStatus status)) {
				errors.Add(new() {
					RowNumber = rowNumber,
					CompanyName = companyName,
					ErrorMessage = $"Invalid Status '{statusText}'. Expected: {string.Join(", ",
						Enum.GetNames<ApplicationStatus>())}."
				});
				continue;
			}

			// Validate AppliedDate (required, culture-invariant parsing)
			if (string.IsNullOrWhiteSpace(appliedDateText)) {
				errors.Add(new() {
					RowNumber = rowNumber, CompanyName = companyName, ErrorMessage = "AppliedDate is required."
				});
				continue;
			}

			if (!DateTime.TryParse(appliedDateText, CultureInfo.InvariantCulture, DateTimeStyles.None,
				    out DateTime appliedDate)) {
				errors.Add(new() {
					RowNumber = rowNumber,
					CompanyName = companyName,
					ErrorMessage = $"Invalid AppliedDate '{appliedDateText}'."
				});
				continue;
			}

			appliedDate = DateTime.SpecifyKind(appliedDate, DateTimeKind.Utc);

			// Read optional fields
			string? postingUrl = row.Cell(4).GetString().Trim();
			if (string.IsNullOrWhiteSpace(postingUrl)) {
				postingUrl = null;
			} else if (!Uri.TryCreate(postingUrl, UriKind.Absolute, out Uri? uri) ||
			           (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)) {
				errors.Add(new() {
					RowNumber = rowNumber,
					CompanyName = companyName,
					ErrorMessage = $"Invalid PostingUrl '{postingUrl}'. Must be a valid HTTP or HTTPS URL."
				});
				continue;
			}

			string? notes = row.Cell(5).GetString().Trim();
			if (string.IsNullOrWhiteSpace(notes)) {
				notes = null;
			}

			// Check for duplicate application in database
			if (await repository.ExistsAsync(companyName, appliedDate, postingUrl, userId)) {
				errors.Add(new() {
					RowNumber = rowNumber,
					CompanyName = companyName,
					ErrorMessage = "Duplicate application — a record with the same company and "
					               + (postingUrl is not null ? "posting URL" : "applied date")
					               + " already exists."
				});
				continue;
			}

			ApplicationRecord entity = new() {
				CompanyName = companyName,
				Status = status,
				AppliedDate = appliedDate,
				PostingUrl = postingUrl,
				Notes = notes,
				UserId = userId
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
