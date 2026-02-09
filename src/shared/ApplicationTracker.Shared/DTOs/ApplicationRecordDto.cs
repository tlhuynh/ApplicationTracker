using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Data transfer object for application records shared between API and clients.
/// </summary>
public class ApplicationRecordDto {
    /// <summary>
    /// Gets or sets the unique identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the name of the company.
    /// </summary>
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
    public string? PostingUrl { get; set; }

    /// <summary>
    /// Gets or sets additional notes about the application.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the record was last modified.
    /// </summary>
    public DateTime LastModified { get; set; }
}
