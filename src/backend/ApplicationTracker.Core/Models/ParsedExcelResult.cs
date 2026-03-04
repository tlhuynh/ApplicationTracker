namespace ApplicationTracker.Core.Models;

/// <summary>
/// Represents the result of parsing an Excel file without saving to the database.
/// </summary>
public class ParseExcelResult {
	/// <summary>Gets or sets the total number of data rows found in the file.</summary>
	public int TotalRows { get; set; }

	/// <summary>Gets or sets the number of rows successfully parsed.</summary>
	public int ParsedCount { get; set; }

	/// <summary>Gets or sets the number of rows that failed validation.</summary>
	public int FailedCount { get; set; }

	/// <summary>Gets or sets the successfully parsed rows.</summary>
	public List<ParsedApplicationRow> ParsedRows { get; set; } = [];

	/// <summary>Gets or sets the per-row validation errors.</summary>
	public List<ExcelImportError> Errors { get; set; } = [];
}
