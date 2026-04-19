using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ClinicKit.Application.Features.Auth;

// ── Command ───────────────────────────────────────────────────────────────────
public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly IIdentityService      _identity;
    private readonly IJwtService           _jwt;

    public RefreshTokenCommandHandler(
        IApplicationDbContext db,
        IIdentityService      identity,
        IJwtService           jwt)
    {
        _db       = db;
        _identity = identity;
        _jwt      = jwt;
    }

    public async Task<AuthResponse> Handle(
        RefreshTokenCommand request,
        CancellationToken   cancellationToken)
    {
        // 1. Look up the token
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh token not found.");

        // 2. Validate it is still active
        if (!stored.IsActive)
            throw new UnauthorizedAccessException(
                stored.IsExpired ? "Refresh token has expired." : "Refresh token has been revoked.");

        // 3. Reload user info to get up-to-date roles / tenant
        var user = await _identity.ValidateUserAsync(stored.UserId)
                   ?? throw new UnauthorizedAccessException("User no longer exists.");

        // 4. Revoke old token (rotate)
        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;

        // 5. Issue new pair
        var now              = DateTime.UtcNow;
        var accessToken      = _jwt.GenerateAccessToken(user.UserId, user.Email, user.TenantId, user.Roles, user.Permissions);
        var rawRefreshToken  = _jwt.GenerateRefreshToken();
        var refreshExpiresAt = now.AddDays(_jwt.RefreshTokenExpiryDays);

        _db.RefreshTokens.Add(new RefreshToken
        {
            Token     = rawRefreshToken,
            UserId    = user.UserId,
            TenantId  = user.TenantId,
            CreatedAt = now,
            ExpiresAt = refreshExpiresAt,
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            AccessToken:          accessToken,
            RefreshToken:         rawRefreshToken,
            AccessTokenExpiresAt: now.AddMinutes(60),
            RefreshTokenExpiresAt: refreshExpiresAt);
    }
}
