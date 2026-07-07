using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for updating the description of an application record.
/// </summary>
public class PatchDescriptionRequest {
	/// <summary>
	/// Gets or sets the full description of the job posting. Null clears the field.
	/// </summary>
	[MaxLength(20000)]
	public string? Description { get; set; }
}