using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Core.Models;

/// <summary>
/// Represents a single successfully parsed row from an Excel import, before saving to the database.
/// </summary>
public class ParsedApplicationRow {
	/// <summary>Gets or sets the name of the company.</summary>
	public string CompanyName { get; set; } = string.Empty;

	/// <summary>Gets or sets the application status.</summary>
	public ApplicationStatus Status { get; set; }

	/// <summary>Gets or sets the date the application was submitted.</summary>
	public DateTime? AppliedDate { get; set; }

	/// <summary>Gets or sets the job posting URL.</summary>
	public string? PostingUrl { get; set; }

	/// <summary>Gets or sets additional notes.</summary>
	public string? Notes { get; set; }
}
