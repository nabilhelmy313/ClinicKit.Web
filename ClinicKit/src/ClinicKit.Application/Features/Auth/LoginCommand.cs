using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ClinicKit.Application.Features.Auth;

// ── Command ───────────────────────────────────────────────────────────────────
public record LoginCommand(string Email, string Password) : IRequest<AuthResponse>;

// ── Validator ─────────────────────────────────────────────────────────────────
public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponse>
{
    private readonly IIdentityService    _identity;
    private readonly IJwtService         _jwt;
    private readonly IApplicationDbContext _db;

    public LoginCommandHandler(
        IIdentityService     identity,
        IJwtService          jwt,
        IApplicationDbContext db)
    {
        _identity = identity;
        _jwt      = jwt;
        _db       = db;
    }

    public async Task<AuthResponse> Handle(
        LoginCommand      request,
        CancellationToken cancellationToken)
    {
        // 1. Validate credentials
        var user = await _identity.ValidateUserAsync(request.Email, request.Password)
                   ?? throw new UnauthorizedAccessException("Invalid email or password.");

        // 2. Revoke any existing active refresh tokens for this user (single-session policy)
        var existing = await _db.RefreshTokens
            .Where(t => t.UserId == user.UserId && !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var old in existing)
        {
            old.IsRevoked = true;
            old.RevokedAt = DateTime.UtcNow;
        }

        // 3. Issue new tokens
        var now              = DateTime.UtcNow;
        var accessToken      = _jwt.GenerateAccessToken(user.UserId, user.Email, user.TenantId, user.Roles, user.Permissions);
        var rawRefreshToken   = _jwt.GenerateRefreshToken();
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
            AccessTokenExpiresAt: now.AddMinutes(60),   // matches JwtSettings default
            RefreshTokenExpiresAt: refreshExpiresAt);
    }
}
