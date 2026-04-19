using ClinicKit.Domain.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ClinicKit.Infrastructure.Persistence.Seeders;

public sealed class AdminUserSeeder
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ILogger<AdminUserSeeder>  _logger;

    private const string AdminEmail    = "admin@clinickit.com";
    private const string AdminPassword = "Admin@123";

    public AdminUserSeeder(
        UserManager<IdentityUser> userManager,
        ILogger<AdminUserSeeder>  logger)
    {
        _userManager = userManager;
        _logger      = logger;
    }

    public async Task SeedAsync()
    {
        var existing = await _userManager.FindByEmailAsync(AdminEmail);
        if (existing is not null)
        {
            _logger.LogInformation("Admin user already exists — skipping.");
            return;
        }

        var user = new IdentityUser
        {
            UserName       = AdminEmail,
            Email          = AdminEmail,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, AdminPassword);
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to create admin user: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        await _userManager.AddToRoleAsync(user, Roles.Admin);
        _logger.LogInformation("Admin user seeded: {Email}", AdminEmail);
    }
}
