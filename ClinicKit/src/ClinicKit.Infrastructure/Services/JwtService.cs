using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Domain.Authorization;
using ClinicKit.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ClinicKit.Infrastructure.Services;

/// <summary>
/// Generates signed JWT access tokens and cryptographically-random refresh tokens.
/// Uses HMAC-SHA256 signing with the secret from JwtSettings.
///
/// Claims embedded in the access token:
///   sub        — userId (IdentityUser.Id)
///   email      — user's email address
///   tenant_id  — clinic the user belongs to (read by CurrentUserService + TenantMiddleware)
///   role       — one claim per role (Admin / Doctor / Receptionist)
///   jti        — unique token ID (useful for future revocation by jti)
/// </summary>
public sealed class JwtService : IJwtService
{
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> options)
        => _settings = options.Value;

    public int RefreshTokenExpiryDays => _settings.RefreshTokenExpiryDays;

    // ── Access Token ──────────────────────────────────────────────────────────
    public string GenerateAccessToken(
        string              userId,
        string              email,
        Guid?               tenantId,
        IEnumerable<string> roles,
        IEnumerable<string> permissions)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        if (tenantId.HasValue)
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));

        // Role claims — used by [Authorize(Roles = "...")] if needed
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        // Permission claims — checked by PermissionAuthorizationHandler
        claims.AddRange(permissions.Select(p => new Claim(Permissions.ClaimType, p)));

        var token = new JwtSecurityToken(
            issuer:             _settings.Issuer,
            audience:           _settings.Audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────
    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
