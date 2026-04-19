using MediatR;
using Microsoft.Extensions.Logging;

namespace ClinicKit.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behaviour: logs every request and its execution time.
/// Helps trace slow commands during development and in production.
/// </summary>
public sealed class LoggingBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;

    public LoggingBehaviour(ILogger<LoggingBehaviour<TRequest, TResponse>> logger)
        => _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        _logger.LogInformation("→ Handling {RequestName}", requestName);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var response = await next();
            sw.Stop();
            _logger.LogInformation("✓ {RequestName} completed in {ElapsedMs}ms",
                requestName, sw.ElapsedMilliseconds);
            return response;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "✗ {RequestName} failed after {ElapsedMs}ms",
                requestName, sw.ElapsedMilliseconds);
            throw;
        }
    }
}
