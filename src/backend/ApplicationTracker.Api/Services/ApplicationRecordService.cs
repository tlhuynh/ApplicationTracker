using ApplicationTracker.Core.Entities;
  using ApplicationTracker.Core.Enums;
  using ApplicationTracker.Core.Interfaces.Repositories;
  using ApplicationTracker.Core.Interfaces.Services;

  namespace ApplicationTracker.Api.Services;

  /// <summary>
  /// Service implementation for application record business logic.
  /// Orchestrates repository calls and applies domain rules.
  /// </summary>
  public class ApplicationRecordService(IApplicationRecordRepository repository) : IApplicationRecordService {
      /// <inheritdoc />
      public async Task<List<ApplicationRecord>> GetAllAsync() {
          return await repository.GetAllAsync();
      }

      /// <inheritdoc />
      public async Task<ApplicationRecord?> GetByIdAsync(int id) {
          return await repository.GetByIdAsync(id);
      }

      /// <inheritdoc />
      public async Task<ApplicationRecord> CreateAsync(ApplicationRecord entity) {
          await repository.AddAsync(entity);
          await repository.SaveChangesAsync();
          return entity;
      }

      /// <inheritdoc />
      public async Task<ApplicationRecord?> UpdateAsync(int id, ApplicationRecord updatedFields) {
          ApplicationRecord? existing = await repository.GetByIdAsync(id);
          if (existing is null) {
              return null;
          }

          existing.CompanyName = updatedFields.CompanyName;
          existing.Status = updatedFields.Status;
          existing.AppliedDate = updatedFields.AppliedDate;
          existing.PostingUrl = updatedFields.PostingUrl;
          existing.Notes = updatedFields.Notes;

          repository.Update(existing);
          await repository.SaveChangesAsync();
          return existing;
      }

      /// <inheritdoc />
      public async Task<ApplicationRecord?> UpdateStatusAsync(int id, ApplicationStatus status) {
          ApplicationRecord? existing = await repository.GetByIdAsync(id);
          if (existing is null) {
              return null;
          }

          existing.Status = status;
          repository.Update(existing);
          await repository.SaveChangesAsync();
          return existing;
      }

      /// <inheritdoc />
      public async Task<bool> DeleteAsync(int id) {
          ApplicationRecord? existing = await repository.GetByIdAsync(id);
          if (existing is null) {
              return false;
          }

          repository.Delete(existing);
          await repository.SaveChangesAsync();
          return true;
      }
  }
