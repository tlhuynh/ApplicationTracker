using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Shared.DTOs;
using ApplicationTracker.Shared.Mappings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ApplicationTracker.Api.Controllers;

/// <summary>
/// REST API controller for managing interviews within an application record.
/// </summary>
[Authorize]
[ApiController]
[Route("api/applicationrecords/{applicationRecordId:int}/interviews")]
public class InterviewsController(IInterviewService service) : ControllerBase {
    /// <summary>
    /// Resolves the authenticated user's identifier from the JWT claims.
    /// </summary>
    private bool TryGetUserId(out string userId) {
        string? id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(id)) {
            userId = string.Empty;
            return false;
        }

        userId = id;
        return true;
    }

    /// <summary>
    /// Retrieves all interviews for the specified application record.
    /// </summary>
    /// <param name="applicationRecordId">The application record identifier.</param>
    [HttpGet]
    public async Task<ActionResult<List<InterviewDto>>> GetAll(int applicationRecordId) {
        if (!TryGetUserId(out string userId)) {
            return Unauthorized();
        }

        List<Interview>? interviews = await service.GetAllAsync(applicationRecordId, userId);
        if (interviews is null) {
            return NotFound();
        }

        return Ok(interviews.Select(i => i.ToDto()).ToList());
    }

    /// <summary>
    /// Creates a new interview for the specified application record.
    /// </summary>
    /// <param name="applicationRecordId">The application record identifier.</param>
    /// <param name="request">The creation request.</param>
    [HttpPost]
    public async Task<ActionResult<InterviewDto>> Create(int applicationRecordId, CreateInterviewRequest request) {
        if (!TryGetUserId(out string userId)) {
            return Unauthorized();
        }

        Interview entity = request.ToEntity();
        Interview? created = await service.CreateAsync(applicationRecordId, entity, userId);
        if (created is null) {
            return NotFound();
        }

        InterviewDto dto = created.ToDto();
        return CreatedAtAction(nameof(GetAll), new { applicationRecordId }, dto);
    }

    /// <summary>
    /// Updates an existing interview.
    /// </summary>
    /// <param name="applicationRecordId">The application record identifier.</param>
    /// <param name="id">The interview identifier.</param>
    /// <param name="request">The update request.</param>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<InterviewDto>> Update(int applicationRecordId, int id, UpdateInterviewRequest request) {
        if (!TryGetUserId(out string userId)) {
            return Unauthorized();
        }

        Interview updatedFields = new() {
            Type = request.Type,
            RoundNumber = request.RoundNumber,
            Date = request.Date!.Value,
            Outcome = request.Outcome,
            Notes = request.Notes
        };

        Interview? updated = await service.UpdateAsync(applicationRecordId, id, updatedFields, userId);
        if (updated is null) {
            return NotFound();
        }

        return Ok(updated.ToDto());
    }

    /// <summary>
    /// Soft-deletes an interview.
    /// </summary>
    /// <param name="applicationRecordId">The application record identifier.</param>
    /// <param name="id">The interview identifier.</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int applicationRecordId, int id) {
        if (!TryGetUserId(out string userId)) {
            return Unauthorized();
        }

        bool deleted = await service.DeleteAsync(applicationRecordId, id, userId);
        if (!deleted) {
            return NotFound();
        }

        return NoContent();
    }
}