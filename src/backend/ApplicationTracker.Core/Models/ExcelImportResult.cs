namespace ApplicationTracker.Core.Models;

/// <summary>
/// Represents the result of an Excel import operation.
/// </summary>
public class ExcelImportResult {
	/// <summary>
	/// Gets or sets the total number of data rows found in the Excel file.
	/// </summary>
	public int TotalRows { get; set; }

	/// <summary>
	/// Gets or sets the number of rows successfully imported.
	/// </summary>
	public int ImportedCount { get; set; }

	/// <summary>
	/// Gets or sets the number of rows that failed validation.
	/// </summary>
	public int FailedCount { get; set; }

	/// <summary>
	/// Gets or sets the list of per-row errors encountered during import.
	/// </summary>
	public List<ExcelImportError> Errors { get; set; } = [];
}
