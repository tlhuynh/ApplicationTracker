using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ApplicationTracker.Infrastructure.Data;

/// <summary>
/// Design-time factory used by EF tooling without API host startup.
/// Resolves the connection string from (in priority order):
///   1. --connection CLI argument
///   2. IConfiguration (appsettings.json + appsettings.Development.json + user-secrets + env vars)
///   3. AZURE_SQL_CONNECTION_STRING environment variable (CI fallback)
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext> {
	/// <summary>
	/// UserSecretsId from ApplicationTracker.Api.csproj — shares the same secrets store
	/// so local `dotnet user-secrets set` commands work without extra setup.
	/// </summary>
	private const string ApiUserSecretsId = "82b4f7eb-8939-415e-83d0-eaf91273e6ea";

	public ApplicationDbContext CreateDbContext(string[] args) {
		string? connectionString =
			GetArgValue(args, "--connection")
			?? BuildConfiguration().GetConnectionString("DefaultConnection")
			?? Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING");

		if (string.IsNullOrWhiteSpace(connectionString)) {
			throw new InvalidOperationException(
				"No SQL connection string was found for design-time migration execution. " +
				"Set ConnectionStrings:DefaultConnection in user-secrets, " +
				"or set the AZURE_SQL_CONNECTION_STRING environment variable.");
		}

		DbContextOptionsBuilder<ApplicationDbContext> optionsBuilder = new();
		optionsBuilder.UseSqlServer(connectionString);

		return new ApplicationDbContext(optionsBuilder.Options);
	}

	/// <summary>
	/// Builds configuration using the same sources as the API host:
	/// appsettings.json → appsettings.Development.json → environment variables → user-secrets.
	/// </summary>
	private static IConfiguration BuildConfiguration() {
		return new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: true)
			.AddJsonFile("appsettings.Development.json", optional: true)
			.AddEnvironmentVariables()
			.AddUserSecrets(ApiUserSecretsId)
			.Build();
	}

	private static string? GetArgValue(IReadOnlyList<string> args, string optionName) {
		for (int i = 0; i < args.Count - 1; i++) {
			if (!string.Equals(args[i], optionName, StringComparison.OrdinalIgnoreCase)) {
				continue;
			}

			string value = args[i + 1];
			return string.IsNullOrWhiteSpace(value) ? null : value;
		}

		return null;
	}
}
