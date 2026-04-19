namespace ClinicKit.Application.Common.Interfaces;

/// <summary>
/// Generates and validates JWT access tokens and opaque refresh tokens.
/// Implemented in Infrastructure so that cryptographic details stay out of Application.
/// </summary>
public interface IJwtService
{
    /// <summary>Creates a signed JWT containing the user's identity and permission claims.</summary>
    string GenerateAccessToken(
        string              userId,
        string              email,
        Guid?               tenantId,
        IEnumerable<string> roles,
        IEnumerable<string> permissions);

    /// <summary>Creates a cryptographically-random opaque refresh token string.</summary>
    string GenerateRefreshToken();

    /// <summary>Number of days before a refresh token expires (from JwtSettings).</summary>
    int RefreshTokenExpiryDays { get; }
}
