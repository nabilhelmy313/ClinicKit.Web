using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace ClinicKit.Application.Common.Authorization;

/// <summary>
/// Dynamically creates an authorization policy for any policy name that is
/// passed to [HasPermission(...)].
///
/// Without this, every permission string would need to be pre-registered
/// manually in AddAuthorization(...). With this provider, any string you
/// pass to [HasPermission] automatically gets a policy that wraps it in a
/// <see cref="PermissionRequirement"/> — no manual wiring needed.
///
/// Unknown policies fall back to the standard DefaultAuthorizationPolicyProvider.
/// </summary>
public sealed class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly DefaultAuthorizationPolicyProvider _fallback;

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        => _fallback = new DefaultAuthorizationPolicyProvider(options);

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Every policy name is treated as a permission string.
        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(policyName))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
        => _fallback.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
        => _fallback.GetFallbackPolicyAsync();
}
