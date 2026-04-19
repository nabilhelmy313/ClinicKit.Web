namespace ClinicKit.Infrastructure.Settings;

/// <summary>
/// Bound from appsettings.json "JwtSettings" section.
/// Injected via IOptions&lt;JwtSettings&gt; into JwtService.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret                  { get; init; } = "";
    public string Issuer                  { get; init; } = "";
    public string Audience                { get; init; } = "";
    public int    AccessTokenExpiryMinutes { get; init; } = 60;
    public int    RefreshTokenExpiryDays   { get; init; } = 7;
}
