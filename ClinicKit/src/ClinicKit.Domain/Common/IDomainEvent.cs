using MediatR;

namespace ClinicKit.Domain.Common;

/// <summary>
/// Marker interface for domain events.
/// Events are dispatched via MediatR after SaveChanges succeeds.
/// Example: PatientRegisteredEvent, AppointmentConfirmedEvent
/// </summary>
public interface IDomainEvent : INotification { }
