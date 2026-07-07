using System.ComponentModel.DataAnnotations.Schema;
using ApplicationTracker.Core.Entities.Base;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Core.Entities;

/// <summary>
/// Represents a job application record.
/// </summary>
public class ApplicationRecord : BaseEntity {
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
    public DateTime? AppliedDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the URL of the job posting.
    /// </summary>
    public string? PostingUrl { get; set; }

    /// <summary>
    /// Gets or sets additional notes about the application.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the full description of the job posting.
    /// Stored off-row and excluded from list queries — fetched only on demand.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Set by projections that exclude <see cref="Description"/> to carry the existence flag
    /// without loading the text. <see cref="ToDto"/> checks both this and <see cref="Description"/>.
    /// </summary>
    [NotMapped]
    public bool HasDescription { get; set; }
}
