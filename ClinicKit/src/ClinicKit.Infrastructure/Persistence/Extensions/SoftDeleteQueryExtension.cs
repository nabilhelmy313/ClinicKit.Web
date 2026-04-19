using System.Linq.Expressions;
using ClinicKit.Domain.Common;
using Microsoft.EntityFrameworkCore.Metadata;

namespace ClinicKit.Infrastructure.Persistence.Extensions;

/// <summary>
/// Dynamically applies HasQueryFilter(e => !e.IsDeleted) to any entity
/// that implements ISoftDeletable without requiring a generic type parameter.
/// Called once in OnModelCreating.
/// </summary>
internal static class SoftDeleteQueryExtension
{
    public static void AddSoftDeleteQueryFilter(this IMutableEntityType entityType)
    {
        var method = typeof(SoftDeleteQueryExtension)
            .GetMethod(nameof(GetFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
            .MakeGenericMethod(entityType.ClrType);

        var filter = method.Invoke(null, null);
        entityType.SetQueryFilter((LambdaExpression)filter!);
    }

    private static LambdaExpression GetFilter<T>() where T : ISoftDeletable
    {
        Expression<Func<T, bool>> expr = e => !e.IsDeleted;
        return expr;
    }
}
