using System.Diagnostics;
using System.Net;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace ClinicKit.API.Middleware;

/// <summary>
/// Catches every unhandled exception and converts it to an RFC-7807 ProblemDetails
/// JSON response so clients always receive a consistent error envelope.
///
/// Exception → HTTP mapping:
///   ValidationException          → 422 Unprocessable Entity  (field errors under "errors" key)
///   UnauthorizedAccessException  → 401 Unauthorized
///   KeyNotFoundException         → 404 Not Found
///   ArgumentException            → 400 Bad Request
///   OperationCanceledException   → 499 (silent — client disconnected, nothing to send)
///   Everything else              → 500 Internal Server Error
///
/// Every response includes:
///   traceId  — W3C trace ID so you can grep Serilog logs by this value
///   instance — the request path that triggered the error
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate                             _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware>  _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate                           next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected mid-request — log quietly and bail
            _logger.LogDebug("Request cancelled by client: {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    private async Task HandleAsync(HttpContext context, Exception ex)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        var (statusCode, title, errors) = ex switch
        {
            ValidationException ve => (
                (int)HttpStatusCode.UnprocessableEntity,
                "One or more validation errors occurred.",
                (object?)ve.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray())),

            UnauthorizedAccessException =>
                ((int)HttpStatusCode.Unauthorized,
                 string.IsNullOrWhiteSpace(ex.Message) ? "Unauthorized." : ex.Message,
                 null),

            KeyNotFoundException =>
                ((int)HttpStatusCode.NotFound,
                 string.IsNullOrWhiteSpace(ex.Message) ? "Resource not found." : ex.Message,
                 null),

            ArgumentException =>
                ((int)HttpStatusCode.BadRequest,
                 string.IsNullOrWhiteSpace(ex.Message) ? "Bad request." : ex.Message,
                 null),

            _ =>
                ((int)HttpStatusCode.InternalServerError,
                 "An unexpected error occurred.",
                 null)
        };

        // ── Structured logging ────────────────────────────────────────────────
        if (statusCode >= 500)
            _logger.LogError(ex,
                "Unhandled exception [{StatusCode}] {Method} {Path} | TraceId: {TraceId}",
                statusCode, context.Request.Method, context.Request.Path, traceId);
        else
            _logger.LogWarning(
                "Handled exception [{StatusCode}] {Title} | {Method} {Path} | TraceId: {TraceId}",
                statusCode, title, context.Request.Method, context.Request.Path, traceId);

        // ── ProblemDetails response ────────────────────────────────────────────
        var problem = new ProblemDetails
        {
            Status   = statusCode,
            Title    = title,
            Type     = $"https://httpstatuses.io/{statusCode}",
            Instance = context.Request.Path,
        };

        problem.Extensions["traceId"] = traceId;   // correlate with Serilog file entry

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        context.Response.StatusCode  = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problem);
    }
}

// ── Extension method ──────────────────────────────────────────────────────────
public static class GlobalExceptionHandlerExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(
        this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
}
