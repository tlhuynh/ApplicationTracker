using ApplicationTracker.Core.Models;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service interface for importing application records from Excel files.
/// </summary>
public interface IExcelImportService {
	/// <summary>
	/// Parses an Excel file stream and imports valid rows as application records.
	/// Invalid rows are skipped and reported in the result.
	/// </summary>
	/// <param name="fileStream">The Excel file stream to import.</param>
	/// <returns>The import result containing counts and any row-level errors.</returns>
	Task<ExcelImportResult> ImportAsync(Stream fileStream);
}
