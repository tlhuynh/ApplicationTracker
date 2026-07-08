using ApplicationTracker.Core.Entities.Base;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Core.Entities;

/// <summary>
/// Represents a single interview stage for a job application.
/// </summary>
public class Interview : BaseEntity {
    /// <summary>
    /// Gets or sets the identifier of the associated application record.
    /// </summary>
    public int ApplicationRecordId { get; set; }

    /// <summary>
    /// Gets or sets the associated application record.
    /// </summary>
    public ApplicationRecord ApplicationRecord { get; set; } = null!;

    /// <summary>
    /// Gets or sets the type of interview stage.
    /// </summary>
    public InterviewType Type { get; set; }

    /// <summary>
    /// Gets or sets the round number within the application process.
    /// </summary>
    public int? RoundNumber { get; set; }

    /// <summary>
    /// Gets or sets the date of the interview.
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Gets or sets the outcome of the interview stage.
    /// </summary>
    public InterviewOutcome? Outcome { get; set; }

    /// <summary>
    /// Gets or sets additional notes about the interview.
    /// </summary>
    public string? Notes { get; set; }
}