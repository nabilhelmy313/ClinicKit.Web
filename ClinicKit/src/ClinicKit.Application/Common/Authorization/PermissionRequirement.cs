using Microsoft.AspNetCore.Authorization;

namespace ClinicKit.Application.Common.Authorization;

/// <summary>
/// Carries the single permission string that must be present in the user's JWT claims.
/// Created dynamically by <see cref="PermissionPolicyProvider"/> for every policy name.
/// </summary>
public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;
