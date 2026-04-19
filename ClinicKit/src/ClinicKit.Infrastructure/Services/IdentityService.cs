using System.Security.Claims;
using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Domain.Authorization;
using Microsoft.AspNetCore.Identity;

namespace ClinicKit.Infrastructure.Services;

/// <summary>
/// Wraps ASP.NET Identity's UserManager to expose only what the Application layer needs.
///
/// Two overloads of ValidateUserAsync:
///   1. (email, password) — used by LoginCommand to authenticate a credential pair.
///   2. (userId)          — used by RefreshTokenCommand to reload user info without re-checking password.
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public IdentityService(
        UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // ── Login: validate email + password ─────────────────────────────────────
    public async Task<AuthUserResult?> ValidateUserAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
            return null;

        var ok = await _userManager.CheckPasswordAsync(user, password);
        if (!ok)
            return null;

        return await BuildResultAsync(user);
    }

    // ── Refresh: reload by userId (no password check) ─────────────────────────
    public async Task<AuthUserResult?> ValidateUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is null ? null : await BuildResultAsync(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    private async Task<AuthUserResult> BuildResultAsync(IdentityUser user)
    {
        var roles      = await _userManager.GetRolesAsync(user);
        var userClaims = await _userManager.GetClaimsAsync(user);

        var tenantId = userClaims
            .FirstOrDefault(c => c.Type == "tenant_id")
            ?.Value is string raw && Guid.TryParse(raw, out var tid)
            ? tid
            : (Guid?)null;

        // Aggregate permission claims from every role the user belongs to.
        // Using a HashSet avoids duplicate permissions when roles overlap.
        var permissions = new HashSet<string>(StringComparer.Ordinal);
        foreach (var roleName in roles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            var roleClaims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in roleClaims.Where(c => c.Type == Permissions.ClaimType))
                permissions.Add(claim.Value);
        }

        return new AuthUserResult(
            UserId:      user.Id,
            Email:       user.Email!,
            Roles:       roles,
            Permissions: permissions.ToList(),
            TenantId:    tenantId);
    }
}
