using System.Security.Claims;
using ClinicKit.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ClinicKit.Infrastructure.Services;

/// <summary>
/// Reads identity info from the current JWT-authenticated HTTP request.
/// Resolves: UserId, UserName, TenantId — used by the Audit interceptor.
/// </summary>
public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool    IsAuthenticated => User?.Identity?.IsAuthenticated == true;
    public string? UserId          => User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? UserName        => User?.FindFirstValue(ClaimTypes.Name)
                                   ?? User?.FindFirstValue(ClaimTypes.Email);

    public Guid? TenantId
    {
        get
        {
            var raw = User?.FindFirstValue("tenant_id");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
