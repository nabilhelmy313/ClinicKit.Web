namespace ClinicKit.Application.Features.Auth;

/// <summary>Returned by Login and Refresh endpoints.</summary>
public record AuthResponse(
    string   AccessToken,
    string   RefreshToken,
    DateTime AccessTokenExpiresAt,
    DateTime RefreshTokenExpiresAt);
