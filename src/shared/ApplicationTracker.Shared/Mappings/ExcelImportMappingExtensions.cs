using ApplicationTracker.Core.Models;
using ApplicationTracker.Shared.DTOs;

namespace ApplicationTracker.Shared.Mappings;

/// <summary>
/// Extension methods for mapping between Excel import domain models and DTOs.
/// </summary>
public static class ExcelImportMappingExtensions {
	/// <summary>
	/// Maps an <see cref="ExcelImportResult"/> to an <see cref="ExcelImportResultDto"/>.
	/// </summary>
	public static ExcelImportResultDto ToDto(this ExcelImportResult result) {
		return new() {
			TotalRows = result.TotalRows,
			ImportedCount = result.ImportedCount,
			FailedCount = result.FailedCount,
			Errors = result.Errors.Select(e => e.ToDto()).ToList()
		};
	}

	/// <summary>
	/// Maps an <see cref="ExcelImportError"/> to an <see cref="ExcelImportErrorDto"/>.
	/// </summary>
	public static ExcelImportErrorDto ToDto(this ExcelImportError error) {
		return new() {
			RowNumber = error.RowNumber,
			CompanyName = error.CompanyName,
			ErrorMessage = error.ErrorMessage
		};
	}
}
