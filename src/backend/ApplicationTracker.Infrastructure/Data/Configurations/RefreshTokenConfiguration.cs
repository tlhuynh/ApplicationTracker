using ApplicationTracker.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ApplicationTracker.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core entity configuration for refresh tokens.
/// </summary>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken> {
	public void Configure(EntityTypeBuilder<RefreshToken> builder) {
		builder.HasKey(e => e.Id);

		builder.Property(e => e.TokenHash)
			.IsRequired()
			.HasMaxLength(64);

		builder.Property(e => e.UserId)
			.IsRequired()
			.HasMaxLength(450);

		builder.Property(e => e.SecurityStamp)
			.HasMaxLength(450);

		builder.HasIndex(e => e.TokenHash)
			.IsUnique()
			.HasFilter("[IsRevoked] = 0");

		builder.HasIndex(e => e.UserId);

		builder.HasOne<IdentityUser>()
			.WithMany()
			.HasForeignKey(e => e.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
