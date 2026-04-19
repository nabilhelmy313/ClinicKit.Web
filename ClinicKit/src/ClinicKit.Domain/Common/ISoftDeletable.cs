namespace ClinicKit.Domain.Common;

/// <summary>
/// Marks a record as logically deleted instead of physically removed.
/// EF Global Query Filter will exclude rows where IsDeleted == true.
/// </summary>
public interface ISoftDeletable
{
    bool      IsDeleted  { get; set; }
    DateTime? DeletedAt  { get; set; }
    string?   DeletedBy  { get; set; }
}
