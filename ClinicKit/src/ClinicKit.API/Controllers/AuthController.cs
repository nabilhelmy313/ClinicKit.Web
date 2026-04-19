using ClinicKit.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicKit.API.Controllers;

/// <summary>
/// Handles JWT authentication: Login, Refresh, and Revoke.
///
/// Endpoints:
///   POST /api/auth/login    — Exchange email+password for access+refresh tokens.
///   POST /api/auth/refresh  — Exchange a valid refresh token for a new token pair.
///   POST /api/auth/revoke   — Revoke a refresh token (requires valid access token).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender) => _sender = sender;

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    /// <summary>Authenticate with email and password. Returns an access + refresh token pair.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken       ct)
    {
        var result = await _sender.Send(
            new LoginCommand(request.Email, request.Password), ct);

        return Ok(result);
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────
    /// <summary>Rotate a refresh token. Old token is revoked; new pair is returned.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshRequest request,
        CancellationToken         ct)
    {
        var result = await _sender.Send(
            new RefreshTokenCommand(request.RefreshToken), ct);

        return Ok(result);
    }

    // ── POST /api/auth/revoke ─────────────────────────────────────────────────
    /// <summary>Revoke a refresh token. Requires a valid access token (logout).</summary>
    [HttpPost("revoke")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke(
        [FromBody] RefreshRequest request,
        CancellationToken         ct)
    {
        await _sender.Send(new RevokeTokenCommand(request.RefreshToken), ct);
        return NoContent();
    }
}

// ── Request DTOs (local to this controller — simple enough not to warrant separate files)
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
