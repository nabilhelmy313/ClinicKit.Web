namespace ClinicKit.Domain.Entities;

/// <summary>
/// Persisted refresh token linked to an ASP.NET Identity user.
/// Intentionally does NOT inherit BaseEntity to avoid tenant/soft-delete
/// query filters — refresh tokens are security primitives, not business records.
/// </summary>
public class RefreshToken
{
    public Guid      Id        { get; set; } = Guid.NewGuid();

    /// <summary>The opaque random token value sent to the client.</summary>
    public string    Token     { get; set; } = "";

    /// <summary>FK to AspNetUsers.Id (IdentityUser.Id).</summary>
    public string    UserId    { get; set; } = "";

    /// <summary>Denormalised tenant — allows fast revoke-all-for-tenant queries.</summary>
    public Guid?     TenantId  { get; set; }

    public DateTime  ExpiresAt { get; set; }
    public DateTime  CreatedAt { get; set; } = DateTime.UtcNow;

    public bool      IsRevoked  { get; set; }
    public DateTime? RevokedAt  { get; set; }

    // ── Computed helpers (not mapped) ─────────────────────────────────────────
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive  => !IsRevoked && !IsExpired;
}
