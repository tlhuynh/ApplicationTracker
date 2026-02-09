namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Data transfer object for the result of an Excel import operation.
/// </summary>
public class ExcelImportResultDto {
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
	public List<ExcelImportErrorDto> Errors { get; set; } = [];
}
