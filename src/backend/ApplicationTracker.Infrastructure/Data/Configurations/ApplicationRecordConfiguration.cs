using ApplicationTracker.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ApplicationTracker.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core entity configuration for ApplicationRecord.
/// </summary>
public class ApplicationRecordConfiguration : IEntityTypeConfiguration<ApplicationRecord> {
	public void Configure(EntityTypeBuilder<ApplicationRecord> builder) {
		builder.HasKey(e => e.Id);

		builder.Property(e => e.CompanyName)
			.IsRequired()
			.HasMaxLength(200);

		builder.Property(e => e.PostingUrl)
			.HasMaxLength(2000);

		builder.Property(e => e.Notes)
			.HasMaxLength(5000);

		builder.Property(e => e.UserId)
			.HasMaxLength(450);

		builder.HasQueryFilter(e => !e.IsDeleted);
	}
}
