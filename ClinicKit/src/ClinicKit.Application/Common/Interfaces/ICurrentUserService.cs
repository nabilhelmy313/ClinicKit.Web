namespace ClinicKit.Application.Common.Interfaces;

/// <summary>
/// Provides identity info from the active HTTP request context.
/// Implemented in the API layer via IHttpContextAccessor.
/// Used by the Audit interceptor to fill CreatedBy / UpdatedBy.
/// </summary>
public interface ICurrentUserService
{
    string? UserId   { get; }
    string? UserName { get; }
    Guid?   TenantId { get; }
    bool    IsAuthenticated { get; }
}
