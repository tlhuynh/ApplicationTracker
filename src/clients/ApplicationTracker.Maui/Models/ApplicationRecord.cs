using ApplicationTracker.Core.Enums;
using ApplicationTracker.Models.Entity;
using SQLite;

namespace ApplicationTracker.Models;

/// <summary>
/// Represents a job application record stored in the local SQLite database.
/// </summary>
public class ApplicationRecord : BaseEntity {
	/// <summary>
	/// Gets or sets the name of the company.
	/// Required field - cannot be null or empty.
	/// </summary>
	[MaxLength(200)]
	[NotNull]
	public string CompanyName { get; set; } = string.Empty;
    /// <summary>
    /// Gets or sets the current status of the application.
    /// Defaults to Applied when a new record is created.
    /// </summary>
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
    /// <summary>
    /// Gets or sets the date and time when the application was submitted.
    /// Defaults to the current date and time when a new record is created.
    /// </summary>
    public DateTime? AppliedDate { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Gets or sets the URL of the job posting.
    /// Optional field - can be null if not available.
    /// </summary>
    [MaxLength(2000)]
    public string? PostingUrl { get; set; }
    /// <summary>
    /// Gets or sets additional notes about the application.
    /// Optional field - can be null if no notes are provided.
    /// </summary>
    [MaxLength(5000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Creates a deep copy of this ApplicationRecord instance.
    /// </summary>
    public ApplicationRecord Clone() => new() {
        Id = Id,
        CreatedAt = CreatedAt,
        LastModified = LastModified,
        UserId = UserId,
        ServerId = ServerId,
        NeedsSync = NeedsSync,
        IsDeleted = IsDeleted,
        CompanyName = CompanyName,
        Status = Status,
        AppliedDate = AppliedDate,
        PostingUrl = PostingUrl,
        Notes = Notes
    };
}
