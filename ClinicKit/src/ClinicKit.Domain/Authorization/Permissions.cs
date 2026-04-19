namespace ClinicKit.Domain.Authorization;

/// <summary>
/// All permission constants in the system, organised by feature module.
///
/// These strings are stored as role claims in AspNetRoleClaims and then
/// embedded in the JWT as "permission" claims on every login / refresh.
///
/// How to add a new module (e.g. for a pharmacy starter kit):
///   1. Add a nested static class here with your constants.
///   2. Assign those constants to the appropriate roles in RolePermissionSeeder.
///   3. Protect your endpoints with [HasPermission(Permissions.YourModule.Action)].
///   That's it — zero other changes needed.
/// </summary>
public static class Permissions
{
    /// <summary>JWT claim type used for permission values.</summary>
    public const string ClaimType = "permission";

    public static class Patients
    {
        public const string View   = "Patients.View";
        public const string Create = "Patients.Create";
        public const string Edit   = "Patients.Edit";
        public const string Delete = "Patients.Delete";
    }

    public static class Appointments
    {
        public const string View   = "Appointments.View";
        public const string Create = "Appointments.Create";
        public const string Edit   = "Appointments.Edit";
        public const string Cancel = "Appointments.Cancel";
    }

    public static class MedicalRecords
    {
        public const string View   = "MedicalRecords.View";
        public const string Create = "MedicalRecords.Create";
        public const string Edit   = "MedicalRecords.Edit";
    }

    public static class Invoices
    {
        public const string View   = "Invoices.View";
        public const string Create = "Invoices.Create";
        public const string Print  = "Invoices.Print";
    }

    public static class Reports
    {
        public const string View = "Reports.View";
    }

    public static class Users
    {
        public const string View   = "Users.View";
        public const string Create = "Users.Create";
        public const string Edit   = "Users.Edit";
        public const string Delete = "Users.Delete";
    }

    public static class Settings
    {
        public const string View = "Settings.View";
        public const string Edit = "Settings.Edit";
    }
}
