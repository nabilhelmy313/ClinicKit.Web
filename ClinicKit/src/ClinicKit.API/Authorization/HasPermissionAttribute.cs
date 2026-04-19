using Microsoft.AspNetCore.Authorization;

namespace ClinicKit.API.Authorization;

/// <summary>
/// Shorthand for [Authorize(Policy = "permission_name")].
///
/// Usage on a controller action:
///   [HasPermission(Permissions.Patients.View)]
///   public async Task&lt;IActionResult&gt; GetPatients(...) { ... }
///
/// The policy name (the permission string) is resolved by PermissionPolicyProvider,
/// which builds a PermissionRequirement on the fly — no manual registration needed.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(permission) { }
}
