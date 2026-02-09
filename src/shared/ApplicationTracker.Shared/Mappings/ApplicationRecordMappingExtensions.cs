using ApplicationTracker.Core.Entities;
  using ApplicationTracker.Shared.DTOs;

  namespace ApplicationTracker.Shared.Mappings;

  /// <summary>
  /// Extension methods for mapping between <see cref="ApplicationRecord"/> entities and DTOs.
  /// </summary>
  public static class ApplicationRecordMappingExtensions {
      /// <summary>
      /// Maps an <see cref="ApplicationRecord"/> entity to an <see cref="ApplicationRecordDto"/>.
      /// Excludes internal fields like UserId, NeedsSync, and IsDeleted.
      /// </summary>
      public static ApplicationRecordDto ToDto(this ApplicationRecord entity) {
          return new() {
              Id = entity.Id,
              CompanyName = entity.CompanyName,
              Status = entity.Status,
              AppliedDate = entity.AppliedDate,
              PostingUrl = entity.PostingUrl,
              Notes = entity.Notes,
              CreatedAt = entity.CreatedAt,
              LastModified = entity.LastModified
          };
      }

      /// <summary>
      /// Maps a <see cref="CreateApplicationRecordRequest"/> to a new <see cref="ApplicationRecord"/> entity.
      /// Timestamps are set automatically by ApplicationDbContext from ApplicationTracker.Infrastructure.
      /// </summary>
      public static ApplicationRecord ToEntity(this CreateApplicationRecordRequest request) {
          return new() {
              CompanyName = request.CompanyName,
              Status = request.Status,
              AppliedDate = request.AppliedDate,
              PostingUrl = request.PostingUrl,
              Notes = request.Notes
          };
      }

      /// <summary>
      /// Applies the values from an <see cref="UpdateApplicationRecordRequest"/> onto an existing
      /// <see cref="ApplicationRecord"/> entity.
      /// </summary>
      public static void ApplyTo(this UpdateApplicationRecordRequest request, ApplicationRecord entity) {
          entity.CompanyName = request.CompanyName;
          entity.Status = request.Status;
          entity.AppliedDate = request.AppliedDate;
          entity.PostingUrl = request.PostingUrl;
          entity.Notes = request.Notes;
      }
  }
