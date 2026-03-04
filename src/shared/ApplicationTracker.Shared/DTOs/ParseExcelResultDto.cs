namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Data transfer object for the result of an Excel parse operation (no database save).
/// </summary>
public class ParseExcelResultDto {
	/// <summary>Gets or sets the total number of data rows found in the Excel file.</summary>
	public int TotalRows { get; set; }

	/// <summary>Gets or sets the number of rows successfully parsed.</summary>
	public int ParsedCount { get; set; }

	/// <summary>Gets or sets the number of rows that failed validation.</summary>
	public int FailedCount { get; set; }

	/// <summary>Gets or sets the successfully parsed rows, ready to be stored by the caller.</summary>
	public List<CreateApplicationRecordRequest> ParsedRecords { get; set; } = [];

	/// <summary>Gets or sets the per-row validation errors.</summary>
	public List<ExcelImportErrorDto> Errors { get; set; } = [];
}
