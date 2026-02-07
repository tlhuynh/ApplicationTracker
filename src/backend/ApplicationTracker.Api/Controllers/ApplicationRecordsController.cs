using ApplicationTracker.Core.Entities;
  using ApplicationTracker.Core.Interfaces.Services;
  using ApplicationTracker.Shared.DTOs;
  using ApplicationTracker.Shared.Mappings;
  using Microsoft.AspNetCore.Mvc;

  namespace ApplicationTracker.Api.Controllers;

  /// <summary>
  /// REST API controller for managing application records.
  /// </summary>
  [ApiController]
  [Route("api/[controller]")]
  public class ApplicationRecordsController(IApplicationRecordService service) : ControllerBase {
      /// <summary>
      /// Retrieves all application records.
      /// </summary>
      [HttpGet]
      public async Task<ActionResult<List<ApplicationRecordDto>>> GetAll() {
          List<ApplicationRecord> records = await service.GetAllAsync();
          List<ApplicationRecordDto> dtos = records.Select(r => r.ToDto()).ToList();
          return Ok(dtos);
      }

      /// <summary>
      /// Retrieves a single application record by its identifier.
      /// </summary>
      /// <param name="id">The record identifier.</param>
      [HttpGet("{id:int}")]
      public async Task<ActionResult<ApplicationRecordDto>> GetById(int id) {
          ApplicationRecord? record = await service.GetByIdAsync(id);
          if (record is null) {
              return NotFound();
          }
          return Ok(record.ToDto());
      }

      /// <summary>
      /// Creates a new application record.
      /// </summary>
      /// <param name="request">The creation request.</param>
      [HttpPost]
      public async Task<ActionResult<ApplicationRecordDto>> Create(CreateApplicationRecordRequest request) {
          ApplicationRecord entity = request.ToEntity();
          ApplicationRecord created = await service.CreateAsync(entity);
          ApplicationRecordDto dto = created.ToDto();
          return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
      }

      /// <summary>
      /// Updates an existing application record.
      /// </summary>
      /// <param name="id">The identifier of the record to update.</param>
      /// <param name="request">The update request.</param>
      [HttpPut("{id:int}")]
      public async Task<ActionResult<ApplicationRecordDto>> Update(int id, UpdateApplicationRecordRequest request)
  {
          ApplicationRecord updatedFields = new() {
              CompanyName = request.CompanyName,
              Status = request.Status,
              AppliedDate = request.AppliedDate,
              PostingUrl = request.PostingUrl,
              Notes = request.Notes
          };

          ApplicationRecord? updated = await service.UpdateAsync(id, updatedFields);
          if (updated is null) {
              return NotFound();
          }
          return Ok(updated.ToDto());
      }

      /// <summary>
      /// Soft-deletes an application record.
      /// </summary>
      /// <param name="id">The identifier of the record to delete.</param>
      [HttpDelete("{id:int}")]
      public async Task<IActionResult> Delete(int id) {
          bool deleted = await service.DeleteAsync(id);
          if (!deleted) {
              return NotFound();
          }
          return NoContent();
      }
  }
