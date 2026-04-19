namespace ClinicKit.Domain.Common;

/// <summary>
/// Scopes a record to a specific tenant (clinic).
/// TenantId is injected automatically from the current JWT claim.
/// </summary>
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
