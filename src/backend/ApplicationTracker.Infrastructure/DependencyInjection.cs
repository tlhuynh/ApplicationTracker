using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Infrastructure.Data;
using ApplicationTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ApplicationTracker.Infrastructure;

/// <summary>
/// Extension methods for registering Infrastructure services.
/// </summary>
public static class DependencyInjection {
	public static IServiceCollection AddInfrastructure(this IServiceCollection services,
		IConfiguration configuration) {
		services.AddDbContext<ApplicationDbContext>(options =>
			options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

		// Register DI for repositories
		services.AddScoped<IApplicationRecordRepository, ApplicationRecordRepository>();

		return services;
	}
}
