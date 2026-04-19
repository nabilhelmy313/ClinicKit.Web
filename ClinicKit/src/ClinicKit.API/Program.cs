using ClinicKit.Application;
using ClinicKit.Infrastructure;
using ClinicKit.Infrastructure.Persistence.Seeders;
using ClinicKit.API.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Logging ───────────────────────────────────────────────────────────────────
builder.AddSerilogLogging();

// ── Application & Infrastructure layers ──────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── ASP.NET Controllers ───────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ClinicKit API", Version = "v1" });

    // Allow passing JWT from Swagger UI
    c.AddSecurityDefinition("Bearer", new()
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ── CORS (adjust origins before production) ───────────────────────────────────
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAll", p =>
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// ── Authorization (required for [HasPermission] attribute) ────────────────────
builder.Services.AddAuthorization();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Seed roles, permissions & admin user (idempotent — safe on every startup) ──
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<RolePermissionSeeder>().SeedAsync();
    await scope.ServiceProvider.GetRequiredService<AdminUserSeeder>().SeedAsync();
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseSerilogRequestLogging();

app.UseGlobalExceptionHandler();   // Global Error Handler — Week 1 Task 5

// ── Swagger UI ────────────────────────────────────────────────────────────────
// Available in Development by default; remove the condition to expose in all envs.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ClinicKit API v1");
    c.RoutePrefix = "swagger"; // UI is at /swagger
});

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseTenantMiddleware();   // Multi-Tenancy — Week 1 Task 2: validates tenant_id JWT claim
app.UseAuthorization();

app.MapControllers();

app.Run();
