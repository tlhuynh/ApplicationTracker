namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Response model for the description field of an application record.
/// </summary>
public class DescriptionDto {
	/// <summary>
	/// Gets or sets the full description of the job posting, or null if none exists.
	/// </summary>
	public string? Description { get; set; }
}
