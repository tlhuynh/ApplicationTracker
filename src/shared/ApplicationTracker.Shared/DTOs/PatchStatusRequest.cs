using System.ComponentModel.DataAnnotations;
using ApplicationTracker.Core.Enums;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for updating only the status of an application record.
/// </summary>
public class PatchStatusRequest {
    /// <summary>
    /// Gets or sets the new status value.
    /// </summary>
    [Required]
    public ApplicationStatus Status { get; set; }
}
