using ClinicKit.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicKit.Application.Common.Interfaces;

/// <summary>
/// Abstraction over EF DbContext exposed to the Application layer.
/// Keeps Application free of Infrastructure / EF details.
/// Add a DbSet&lt;T&gt; here for every aggregate you need to query from handlers.
/// </summary>
public interface IApplicationDbContext
{
    // ── Auth ──────────────────────────────────────────────────────────────────
    DbSet<RefreshToken> RefreshTokens { get; }

    // ── Clinic domain (added per sprint) ──────────────────────────────────────
    // DbSet<Patient>     Patients     { get; }
    // DbSet<Appointment> Appointments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
