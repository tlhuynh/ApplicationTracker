using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Data transfer object for an interview record.
/// </summary>
public class InterviewDto {
    /// <summary>
    /// Gets or sets the unique identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the associated application record.
    /// </summary>
    public int ApplicationRecordId { get; set; }

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

    /// <summary>
    /// Gets or sets the date and time when the record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the record was last modified.
    /// </summary>
    public DateTime LastModified { get; set; }
}