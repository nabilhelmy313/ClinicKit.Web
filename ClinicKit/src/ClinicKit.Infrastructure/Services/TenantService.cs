using ClinicKit.Application.Common.Interfaces;

namespace ClinicKit.Infrastructure.Services;

/// <summary>
/// Resolves the current tenant by delegating to ICurrentUserService,
/// which reads the "tenant_id" JWT claim.
///
/// Registered as Scoped — a fresh instance per HTTP request.
/// </summary>
public sealed class TenantService : ITenantService
{
    private readonly ICurrentUserService _currentUser;

    public TenantService(ICurrentUserService currentUser)
        => _currentUser = currentUser;

    public Guid? TenantId  => _currentUser.TenantId;
    public bool  HasTenant => TenantId.HasValue;
}
