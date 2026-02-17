using ApplicationTracker.Core.Models;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service interface for importing application records from Excel files.
/// </summary>
public interface IExcelImportService {
	/// <summary>
	/// Parses an Excel file stream and imports valid rows as application records for the specified user.
	/// Invalid rows are skipped and reported in the result.
	/// </summary>
	/// <param name="fileStream">The Excel file stream to import.</param>
	/// <param name="userId">The user identifier to associate with imported records.</param>
	/// <returns>The import result containing counts and any row-level errors.</returns>
	Task<ExcelImportResult> ImportAsync(Stream fileStream, string userId);
}
