namespace ClinicKit.Application.Common.Interfaces;

/// <summary>
/// Abstracts ASP.NET Identity operations needed by the Application layer.
/// Keeps Application free of UserManager / SignInManager Infrastructure details.
/// </summary>
public interface IIdentityService
{
    /// <summary>
    /// Validates email + password.
    /// Returns a populated <see cref="AuthUserResult"/> on success, or null on failure.
    /// </summary>
    Task<AuthUserResult?> ValidateUserAsync(string email, string password);

    /// <summary>
    /// Reloads user info by userId without re-checking the password.
    /// Used by RefreshTokenCommand to get up-to-date roles and tenant.
    /// </summary>
    Task<AuthUserResult?> ValidateUserAsync(string userId);
}

/// <summary>Projection of the Identity user needed to build JWT claims.</summary>
public record AuthUserResult(
    string        UserId,
    string        Email,
    IList<string> Roles,
    IList<string> Permissions,
    Guid?         TenantId);
