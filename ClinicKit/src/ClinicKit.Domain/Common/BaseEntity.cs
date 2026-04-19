namespace ClinicKit.Domain.Common;

/// <summary>
/// Root base class for every domain entity in the system.
///
/// Combines three cross-cutting concerns:
///   1. Identity      — Guid primary key (database-agnostic, no sequential leak)
///   2. Multi-Tenancy — TenantId isolates rows per clinic; set automatically by
///                      TenantMiddleware from the JWT "tenant_id" claim.
///   3. Audit         — CreatedAt/By + UpdatedAt/By filled by EF SaveChanges interceptor.
///   4. Soft-Delete   — IsDeleted flag; EF Global Query Filter hides deleted rows so
///                      no consumer accidentally reads stale data.
///
/// Usage:
///   public class Patient : BaseEntity { ... }
/// </summary>
public abstract class BaseEntity : IAuditableEntity, ISoftDeletable, ITenantEntity
{
    // ── Identity ──────────────────────────────────────────────────────────────
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Multi-Tenancy ─────────────────────────────────────────────────────────
    /// <summary>
    /// Foreign key to the Tenant (Clinic) that owns this record.
    /// Never set this manually — TenantMiddleware injects it before SaveChanges.
    /// </summary>
    public Guid TenantId { get; set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime  CreatedAt  { get; set; } = DateTime.UtcNow;
    public string?   CreatedBy  { get; set; }
    public DateTime? UpdatedAt  { get; set; }
    public string?   UpdatedBy  { get; set; }

    // ── Soft Delete ───────────────────────────────────────────────────────────
    public bool      IsDeleted  { get; set; } = false;
    public DateTime? DeletedAt  { get; set; }
    public string?   DeletedBy  { get; set; }

    // ── Domain Events (optional, ready for later) ─────────────────────────────
    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(IDomainEvent domainEvent)    => _domainEvents.Add(domainEvent);
    public void RemoveDomainEvent(IDomainEvent domainEvent) => _domainEvents.Remove(domainEvent);
    public void ClearDomainEvents()                          => _domainEvents.Clear();
}
