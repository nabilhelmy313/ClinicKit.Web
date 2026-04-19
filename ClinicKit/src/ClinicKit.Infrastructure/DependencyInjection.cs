using System.Text;
using ClinicKit.Application.Common.Authorization;
using ClinicKit.Application.Common.Interfaces;
using ClinicKit.Infrastructure.Persistence;
using ClinicKit.Infrastructure.Persistence.Seeders;
using ClinicKit.Infrastructure.Services;
using ClinicKit.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Serilog;

namespace ClinicKit.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration          configuration)
    {
        // ── Database ──────────────────────────────────────────────────────────
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
 
        services.AddScoped<IApplicationDbContext>(
            provider => provider.GetRequiredService<ApplicationDbContext>());

        // ── ASP.NET Identity ──────────────────────────────────────────────────
        // AddIdentityCore (no cookie middleware) — pure API, JWT-only auth.
        services.AddIdentityCore<IdentityUser>(opt =>
            {
                opt.Password.RequireDigit           = true;
                opt.Password.RequireLowercase       = true;
                opt.Password.RequireUppercase       = false;
                opt.Password.RequireNonAlphanumeric = false;
                opt.Password.RequiredLength         = 6;
                opt.User.RequireUniqueEmail         = true;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // ── JWT Settings ──────────────────────────────────────────────────────
        var jwtSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSection);
        var jwt = jwtSection.Get<JwtSettings>()!;

        // ── JWT Bearer Authentication ──────────────────────────────────────────
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer           = true,
                    ValidateAudience         = true,
                    ValidateLifetime         = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer              = jwt.Issuer,
                    ValidAudience            = jwt.Audience,
                    IssuerSigningKey         = new SymmetricSecurityKey(
                                                  Encoding.UTF8.GetBytes(jwt.Secret)),
                    ClockSkew                = TimeSpan.Zero,  // no tolerance window
                };
            });

        // ── Current User + Tenant (via IHttpContextAccessor) ──────────────────
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITenantService,      TenantService>();

        // ── Auth services (Week 1 Task 3) ─────────────────────────────────────
        services.AddScoped<IJwtService,      JwtService>();
        services.AddScoped<IIdentityService, IdentityService>();

        // ── Roles & Permissions (Week 1 Task 4) ───────────────────────────────
        // Dynamic policy provider — turns any [HasPermission("X")] into a policy
        // that wraps a PermissionRequirement("X"), with no manual registration.
        services.AddSingleton<IAuthorizationPolicyProvider,  PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler,            PermissionAuthorizationHandler>();

        // Seeders — idempotent, run on startup via Program.cs
        services.AddScoped<RolePermissionSeeder>();
        services.AddScoped<AdminUserSeeder>();

        return services;
    }

    public static void AddSerilogLogging(this WebApplicationBuilder builder)
    {
        // Sinks, enrichers, and levels are all configured in appsettings.json "Serilog" section.
        // Override per-environment via appsettings.Development.json etc.
        builder.Host.UseSerilog((ctx, lc) =>
            lc.ReadFrom.Configuration(ctx.Configuration));
    }
}
