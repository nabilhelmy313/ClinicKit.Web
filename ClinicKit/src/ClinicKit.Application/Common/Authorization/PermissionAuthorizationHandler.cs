using ClinicKit.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace ClinicKit.Application.Common.Authorization;

/// <summary>
/// Checks whether the authenticated user's JWT contains a "permission" claim
/// that matches the value in <see cref="PermissionRequirement"/>.
///
/// No database hit — the permission list is baked into the JWT at login time
/// so this check is pure in-memory claim inspection.
/// </summary>
public sealed class PermissionAuthorizationHandler
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement       requirement)
    {
        var hasClaim = context.User.Claims
            .Any(c => c.Type  == Permissions.ClaimType
                   && c.Value == requirement.Permission);

        if (hasClaim)
            context.Succeed(requirement);

        // If the claim is absent we simply don't call Succeed — the framework
        // will return 403 Forbidden automatically.
        return Task.CompletedTask;
    }
}
