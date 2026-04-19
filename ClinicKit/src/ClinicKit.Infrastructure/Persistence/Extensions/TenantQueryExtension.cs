using System.Linq.Expressions;
using System.Reflection;
using ClinicKit.Domain.Common;
using ClinicKit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Metadata;

namespace ClinicKit.Infrastructure.Persistence.Extensions;

/// <summary>
/// Dynamically builds and registers EF Core Global Query Filters for tenant isolation.
///
/// EF Core only supports ONE HasQueryFilter per entity type.
/// Therefore this extension handles three cases:
///
///   Case A — BaseEntity (implements BOTH ISoftDeletable + ITenantEntity):
///     e => !e.IsDeleted
///          &amp;&amp; (!context.CurrentTenantId.HasValue || e.TenantId == context.CurrentTenantId.Value)
///
///   Case B — ISoftDeletable only (e.g. lightweight value objects):
///     e => !e.IsDeleted
///
///   Case C — ITenantEntity only:
///     e => !context.CurrentTenantId.HasValue || e.TenantId == context.CurrentTenantId.Value
///
/// The filter captures `context` (the DbContext instance).
/// Because ApplicationDbContext is Scoped, EF Core re-evaluates CurrentTenantId
/// on every query using the actual request's DbContext — correct multi-tenancy per request.
/// </summary>
internal static class TenantQueryExtension
{
    // ── Case A: combined SoftDelete + Tenant ─────────────────────────────────────
    public static void AddSoftDeleteAndTenantFilter(
        this IMutableEntityType entityType,
        ApplicationDbContext    context)
    {
        var method = typeof(TenantQueryExtension)
            .GetMethod(nameof(GetCombinedFilter), BindingFlags.NonPublic | BindingFlags.Static)!
            .MakeGenericMethod(entityType.ClrType);

        var filter = method.Invoke(null, [context]);
        entityType.SetQueryFilter((LambdaExpression)filter!);
    }

    private static LambdaExpression GetCombinedFilter<T>(ApplicationDbContext context)
        where T : class, ISoftDeletable, ITenantEntity
    {
        Expression<Func<T, bool>> expr =
            e => !e.IsDeleted
                 && (!context.CurrentTenantId.HasValue
                     || e.TenantId == context.CurrentTenantId.Value);
        return expr;
    }

    // ── Case C: Tenant only ───────────────────────────────────────────────────────
    public static void AddTenantOnlyFilter(
        this IMutableEntityType entityType,
        ApplicationDbContext    context)
    {
        var method = typeof(TenantQueryExtension)
            .GetMethod(nameof(GetTenantFilter), BindingFlags.NonPublic | BindingFlags.Static)!
            .MakeGenericMethod(entityType.ClrType);

        var filter = method.Invoke(null, [context]);
        entityType.SetQueryFilter((LambdaExpression)filter!);
    }

    private static LambdaExpression GetTenantFilter<T>(ApplicationDbContext context)
        where T : class, ITenantEntity
    {
        Expression<Func<T, bool>> expr =
            e => !context.CurrentTenantId.HasValue
                 || e.TenantId == context.CurrentTenantId.Value;
        return expr;
    }
}
