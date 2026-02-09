namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Represents a single row-level error encountered during an Excel import.
/// </summary>
public class ExcelImportErrorDto {
	/// <summary>
	/// Gets or sets the 1-based row number from the Excel file where the error occurred.
	/// </summary>
	public int RowNumber { get; set; }

	/// <summary>
	/// Gets or sets the company name from the row, if readable.
	/// </summary>
	public string? CompanyName { get; set; }

	/// <summary>
	/// Gets or sets the error message describing what went wrong.
	/// </summary>
	public string ErrorMessage { get; set; } = string.Empty;
}
