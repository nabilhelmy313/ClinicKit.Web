using System.Reflection;
using ClinicKit.Application.Common.Behaviours;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace ClinicKit.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(global::MediatR.IPipelineBehavior<,>),
                            typeof(LoggingBehaviour<,>));
            cfg.AddBehavior(typeof(global::MediatR.IPipelineBehavior<,>),
                            typeof(ValidationBehaviour<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
