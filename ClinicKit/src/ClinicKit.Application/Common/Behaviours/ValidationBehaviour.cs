using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ClinicKit.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behaviour: runs all FluentValidation validators for a request
/// before it reaches the handler. Throws ValidationException on failure so
/// the Global Error Handler can return a 422 ProblemDetails response.
/// </summary>
public sealed class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    private readonly ILogger<ValidationBehaviour<TRequest, TResponse>> _logger;

    public ValidationBehaviour(
        IEnumerable<IValidator<TRequest>> validators,
        ILogger<ValidationBehaviour<TRequest, TResponse>> logger)
    {
        _validators = validators;
        _logger     = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count != 0)
        {
            _logger.LogWarning("Validation failed for {RequestType}: {Errors}",
                typeof(TRequest).Name, failures.Select(f => f.ErrorMessage));

            throw new ValidationException(failures);
        }

        return await next();
    }
}
