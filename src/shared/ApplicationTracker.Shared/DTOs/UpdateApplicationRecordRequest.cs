using System.ComponentModel.DataAnnotations;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for updating an existing application record.
/// Id is provided via the route parameter, not the request body.
/// </summary>
public class UpdateApplicationRecordRequest {
	/// <summary>
	/// Gets or sets the name of the company.
	/// </summary>
	[Required]
	[MaxLength(200)]
	public string CompanyName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the current status of the application.
	/// </summary>
	public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;

	/// <summary>
	/// Gets or sets the date and time when the application was submitted.
	/// </summary>
	public DateTime? AppliedDate { get; set; }

	/// <summary>
	/// Gets or sets the URL of the job posting.
	/// </summary>
	[MaxLength(2000)]
	public string? PostingUrl { get; set; }

	/// <summary>
	/// Gets or sets additional notes about the application.
	/// </summary>
	[MaxLength(5000)]
	public string? Notes { get; set; }
}
