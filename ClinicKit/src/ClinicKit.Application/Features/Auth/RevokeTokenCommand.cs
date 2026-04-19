using ClinicKit.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ClinicKit.Application.Features.Auth;

// ── Command ───────────────────────────────────────────────────────────────────
public record RevokeTokenCommand(string RefreshToken) : IRequest;

// ── Handler ───────────────────────────────────────────────────────────────────
public sealed class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService   _currentUser;

    public RevokeTokenCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService   currentUser)
    {
        _db          = db;
        _currentUser = currentUser;
    }

    public async Task Handle(
        RevokeTokenCommand request,
        CancellationToken  cancellationToken)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh token not found.");

        // Security: a user can only revoke their own tokens
        if (token.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Cannot revoke a token belonging to another user.");

        if (token.IsRevoked)
            return; // idempotent — already revoked, nothing to do

        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}
