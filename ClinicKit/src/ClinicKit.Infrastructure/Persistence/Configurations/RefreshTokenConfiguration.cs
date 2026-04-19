using ClinicKit.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicKit.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core mapping for the RefreshToken table.
/// Intentionally has NO global query filter — tokens must always be findable
/// by their token string regardless of tenant or soft-delete state.
/// </summary>
public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Token)
               .HasMaxLength(512)
               .IsRequired();

        builder.Property(x => x.UserId)
               .HasMaxLength(450)   // matches AspNetUsers.Id column length
               .IsRequired();

        // Unique index — no two rows for the same token string
        builder.HasIndex(x => x.Token).IsUnique();

        // Composite index for the common query: active tokens for a user
        builder.HasIndex(x => new { x.UserId, x.IsRevoked, x.ExpiresAt });

        // Computed props — not mapped to columns
        builder.Ignore(x => x.IsExpired);
        builder.Ignore(x => x.IsActive);
    }
}
