using ApplicationTracker.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ApplicationTracker.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core entity configuration for Interview.
/// </summary>
public class InterviewConfiguration : IEntityTypeConfiguration<Interview> {
    public void Configure(EntityTypeBuilder<Interview> builder) {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Notes)
            .HasMaxLength(5000);

        builder.Property(e => e.UserId)
            .HasMaxLength(450);

        builder.HasOne(e => e.ApplicationRecord)
            .WithMany(r => r.Interviews)
            .HasForeignKey(e => e.ApplicationRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
