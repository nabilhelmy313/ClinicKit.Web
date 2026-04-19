using ClinicKit.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ClinicKit.API.Middleware;

/// <summary>
/// Validates that every authenticated HTTP request carries a valid "tenant_id" JWT claim.
///
/// Why: Without this guard, a token with a missing tenant claim would silently bypass
/// multi-tenancy filters, potentially leaking cross-tenant data.
///
/// Behaviour:
///   • Unauthenticated requests  → passed through (Swagger, health-checks, login endpoint).
///   • Authenticated + TenantId  → passed through to the next middleware.
///   • Authenticated + no TenantId → 400 Bad Request with a JSON ProblemDetails body.
///
/// Registration: must be placed AFTER app.UseAuthentication() in Program.cs so that
/// the JWT has already been parsed and User.Identity.IsAuthenticated is set.
/// </summary>
public sealed class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        if (context.User.Identity?.IsAuthenticated == true && !tenantService.HasTenant)
        {
            context.Response.StatusCode  = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(
                """
                {
                  "type":   "https://clinickit.io/errors/tenant-missing",
                  "title":  "Tenant claim is missing.",
                  "detail": "The JWT token does not contain a valid 'tenant_id' claim.",
                  "status": 400
                }
                """);
            return;
        }

        await _next(context);
    }
}

/// <summary>Extension method for clean registration in Program.cs.</summary>
public static class TenantMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder app)
        => app.UseMiddleware<TenantMiddleware>();
}
