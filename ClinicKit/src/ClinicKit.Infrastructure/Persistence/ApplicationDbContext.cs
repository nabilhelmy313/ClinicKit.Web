using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Domain.Common;
using ClinicKit.Domain.Entities;
using ClinicKit.Infrastructure.Persistence.Extensions;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ClinicKit.Infrastructure.Persistence;

/// <summary>
/// Main EF DbContext. Inherits IdentityDbContext so ASP.NET Identity tables
/// (Users, Roles, Claims …) live in the same database.
///
/// Three automatic behaviours fire on every SaveChanges:
///   1. Audit:        CreatedAt/By and UpdatedAt/By are filled automatically.
///   2. Soft-Delete:  Instead of DELETE, IsDeleted=true + DeletedAt are set.
///   3. TenantId:     Auto-stamped on new entities from the current JWT claim.
///
/// Two Global Query Filters are applied per entity in OnModelCreating:
///   • SoftDelete — hides IsDeleted=true rows.
///   • Tenant     — hides rows belonging to other tenants.
/// Both are combined into a single filter expression (EF Core allows only one per type).
/// </summary>
public class ApplicationDbContext : IdentityDbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUser;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    // ── Tenant filter accessor ────────────────────────────────────────────────
    /// <summary>
    /// Captured by TenantQueryExtension's expression tree.
    /// EF Core re-evaluates this on every query using the scoped DbContext instance,
    /// so each HTTP request sees only its own tenant's data.
    /// </summary>
    internal Guid? CurrentTenantId => _currentUser.TenantId;

    // ── DbSets ────────────────────────────────────────────────────────────────
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Clinic domain — uncomment as each feature is built:
    // public DbSet<Patient>     Patients     => Set<Patient>();
    // public DbSet<Appointment> Appointments => Set<Appointment>();

    // ─────────────────────────────────────────────────────────────────────────
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all IEntityTypeConfiguration<T> classes found in this assembly
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // ── Global Query Filters ──────────────────────────────────────────────
        // EF Core allows only ONE HasQueryFilter per entity type.
        // We therefore combine SoftDelete + Tenant into a single expression for
        // entities that implement both (i.e. all BaseEntity descendants).
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            var clrType       = entityType.ClrType;
            var isSoftDel     = typeof(ISoftDeletable).IsAssignableFrom(clrType);
            var isTenantEntity = typeof(ITenantEntity).IsAssignableFrom(clrType);

            if (isSoftDel && isTenantEntity)
                // BaseEntity descendants — combined filter (most common case)
                entityType.AddSoftDeleteAndTenantFilter(this);
            else if (isSoftDel)
                // Soft-delete only (e.g. lightweight entities not owned by a tenant)
                entityType.AddSoftDeleteQueryFilter();
            else if (isTenantEntity)
                // Tenant-scoped only (no soft-delete)
                entityType.AddTenantOnlyFilter(this);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        ApplyAuditAndSoftDelete();
        return await base.SaveChangesAsync(cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    private void ApplyAuditAndSoftDelete()
    {
        var now  = DateTime.UtcNow;
        var user = _currentUser.UserName ?? "system";

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = user;
                    // Auto-stamp TenantId from the current JWT claim
                    if (entry.Entity.TenantId == Guid.Empty && _currentUser.TenantId.HasValue)
                        entry.Entity.TenantId = _currentUser.TenantId.Value;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = user;
                    break;

                case EntityState.Deleted when entry.Entity is ISoftDeletable softDel:
                    // Intercept hard-delete → convert to soft-delete
                    entry.State       = EntityState.Modified;
                    softDel.IsDeleted = true;
                    softDel.DeletedAt = now;
                    softDel.DeletedBy = user;
                    break;
            }
        }
    }
}
