namespace ClinicKit.Domain.Authorization;

/// <summary>
/// Default role name constants shared across all layers.
/// Stored as IdentityRole records in AspNetRoles and embedded in JWT as ClaimTypes.Role.
/// </summary>
public static class Roles
{
    public const string Admin        = "Admin";
    public const string Doctor       = "Doctor";
    public const string Receptionist = "Receptionist";

    /// <summary>All seeded role names — useful for iteration in seeders / tests.</summary>
    public static readonly IReadOnlyList<string> All = [Admin, Doctor, Receptionist];
}
