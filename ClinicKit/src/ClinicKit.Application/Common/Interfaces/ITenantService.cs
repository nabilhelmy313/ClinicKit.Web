namespace ClinicKit.Application.Common.Interfaces;

/// <summary>
/// Provides the active Tenant (Clinic) identifier for the current HTTP request.
/// The value is populated from the JWT "tenant_id" claim and validated by
/// TenantMiddleware before any handler executes.
/// </summary>
public interface ITenantService
{
    /// <summary>Current tenant ID, or null for unauthenticated / system contexts.</summary>
    Guid? TenantId { get; }

    /// <summary>True when a tenant has been resolved from the current request.</summary>
    bool HasTenant { get; }
}
