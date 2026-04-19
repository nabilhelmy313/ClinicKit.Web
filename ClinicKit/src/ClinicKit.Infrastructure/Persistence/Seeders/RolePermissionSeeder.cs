using System.Security.Claims;
using ClinicKit.Domain.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ClinicKit.Infrastructure.Persistence.Seeders;

/// <summary>
/// Idempotent seeder that creates the three default roles and assigns granular
/// permission claims to each one via AspNetRoleClaims.
///
/// Idempotent = safe to run on every startup. It only inserts what is missing.
///
/// ── How to customise for a new client / starter kit ──────────────────────
///  • To add a new role:   add a new entry to RolePermissions below.
///  • To add a permission: add the constant to Permissions.cs, then include
///    it in the appropriate role(s) here.
///  • To restrict a role:  remove a permission string from its list.
///  Everything else (JWT embedding, claim checking) is automatic.
/// ─────────────────────────────────────────────────────────────────────────
/// </summary>
public sealed class RolePermissionSeeder
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<RolePermissionSeeder> _logger;

    // ── Permission matrix ─────────────────────────────────────────────────────
    // Edit this to change what each role can do. No other file needs to change.
    private static readonly Dictionary<string, string[]> RolePermissions = new()
    {
        [Roles.Admin] =
        [
            // Patients
            Permissions.Patients.View,
            Permissions.Patients.Create,
            Permissions.Patients.Edit,
            Permissions.Patients.Delete,
            // Appointments
            Permissions.Appointments.View,
            Permissions.Appointments.Create,
            Permissions.Appointments.Edit,
            Permissions.Appointments.Cancel,
            // Medical Records
            Permissions.MedicalRecords.View,
            Permissions.MedicalRecords.Create,
            Permissions.MedicalRecords.Edit,
            // Invoices
            Permissions.Invoices.View,
            Permissions.Invoices.Create,
            Permissions.Invoices.Print,
            // Reports
            Permissions.Reports.View,
            // Users
            Permissions.Users.View,
            Permissions.Users.Create,
            Permissions.Users.Edit,
            Permissions.Users.Delete,
            // Settings
            Permissions.Settings.View,
            Permissions.Settings.Edit,
        ],

        [Roles.Doctor] =
        [
            // Clinical access only — no billing, no user management
            Permissions.Patients.View,
            Permissions.Appointments.View,
            Permissions.MedicalRecords.View,
            Permissions.MedicalRecords.Create,
            Permissions.MedicalRecords.Edit,
        ],

        [Roles.Receptionist] =
        [
            // Front-desk access — no medical records, no user management
            Permissions.Patients.View,
            Permissions.Patients.Create,
            Permissions.Patients.Edit,
            Permissions.Appointments.View,
            Permissions.Appointments.Create,
            Permissions.Appointments.Edit,
            Permissions.Appointments.Cancel,
            Permissions.Invoices.View,
            Permissions.Invoices.Create,
            Permissions.Invoices.Print,
        ],
    };

    public RolePermissionSeeder(
        RoleManager<IdentityRole>     roleManager,
        ILogger<RolePermissionSeeder> logger)
    {
        _roleManager = roleManager;
        _logger      = logger;
    }

    public async Task SeedAsync()
    {
        foreach (var (roleName, permissions) in RolePermissions)
        {
            await EnsureRoleExistsAsync(roleName);
            await SyncPermissionsAsync(roleName, permissions);
        }

        _logger.LogInformation("RolePermissionSeeder completed.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await _roleManager.RoleExistsAsync(roleName))
            return;

        var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
        if (result.Succeeded)
            _logger.LogInformation("Created role: {Role}", roleName);
        else
            _logger.LogError("Failed to create role {Role}: {Errors}",
                roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    private async Task SyncPermissionsAsync(string roleName, string[] desiredPermissions)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role is null) return;

        var existingClaims = await _roleManager.GetClaimsAsync(role);
        var existingPerms  = existingClaims
            .Where(c => c.Type == Permissions.ClaimType)
            .Select(c => c.Value)
            .ToHashSet(StringComparer.Ordinal);

        // Add any permissions that are missing
        foreach (var perm in desiredPermissions.Where(p => !existingPerms.Contains(p)))
        {
            var result = await _roleManager.AddClaimAsync(
                role, new Claim(Permissions.ClaimType, perm));

            if (result.Succeeded)
                _logger.LogInformation("Added permission '{Permission}' to role '{Role}'", perm, roleName);
            else
                _logger.LogWarning("Could not add permission '{Permission}' to role '{Role}': {Errors}",
                    perm, roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        // Note: we intentionally do NOT remove permissions that are no longer in the list.
        // Removing permissions from production roles should be a deliberate DBA action,
        // not a side-effect of a code deploy. Remove this comment if you want auto-cleanup.
    }
}
