namespace ClinicKit.Domain.Common;

/// <summary>
/// Tracks who created and last modified a record, and when.
/// </summary>
public interface IAuditableEntity
{
    DateTime    CreatedAt  { get; set; }
    string?     CreatedBy  { get; set; }
    DateTime?   UpdatedAt  { get; set; }
    string?     UpdatedBy  { get; set; }
}
