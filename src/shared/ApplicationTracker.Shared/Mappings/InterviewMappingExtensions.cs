using ApplicationTracker.Core.Entities;
using ApplicationTracker.Shared.DTOs;

namespace ApplicationTracker.Shared.Mappings;

/// <summary>
/// Extension methods for mapping between <see cref="Interview"/> entities and DTOs.
/// </summary>
public static class InterviewMappingExtensions {
    /// <summary>
    /// Maps an <see cref="Interview"/> entity to an <see cref="InterviewDto"/>.
    /// </summary>
    public static InterviewDto ToDto(this Interview entity) {
        return new() {
            Id = entity.Id,
            ApplicationRecordId = entity.ApplicationRecordId,
            Type = entity.Type,
            RoundNumber = entity.RoundNumber,
            Date = entity.Date,
            Outcome = entity.Outcome,
            Notes = entity.Notes,
            CreatedAt = entity.CreatedAt,
            LastModified = entity.LastModified
        };
    }

    /// <summary>
    /// Maps a <see cref="CreateInterviewRequest"/> to a new <see cref="Interview"/> entity.
    /// </summary>
    public static Interview ToEntity(this CreateInterviewRequest request) {
        return new() {
            Type = request.Type,
            RoundNumber = request.RoundNumber,
            Date = request.Date!.Value,
            Outcome = request.Outcome,
            Notes = request.Notes
        };
    }
}