using System.ComponentModel.DataAnnotations;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for updating an existing interview record.
/// </summary>
public class UpdateInterviewRequest {
    /// <summary>
    /// Gets or sets the type of interview stage.
    /// </summary>
    [Required]
    public InterviewType Type { get; set; }

    /// <summary>
    /// Gets or sets the round number within the application process.
    /// </summary>
    public int? RoundNumber { get; set; }

    /// <summary>
    /// Gets or sets the date of the interview.
    /// </summary>
    [Required]
    public DateTime? Date { get; set; }

    /// <summary>
    /// Gets or sets the outcome of the interview stage.
    /// </summary>
    public InterviewOutcome? Outcome { get; set; }

    /// <summary>
    /// Gets or sets additional notes about the interview.
    /// </summary>
    [MaxLength(5000)]
    public string? Notes { get; set; }
}