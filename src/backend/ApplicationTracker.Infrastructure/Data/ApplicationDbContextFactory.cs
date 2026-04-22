using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ApplicationTracker.Infrastructure.Data;

/// <summary>
/// Design-time factory used by EF tooling without API host startup.
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext> {
	public ApplicationDbContext CreateDbContext(string[] args) {
		string? connectionString =
			GetArgValue(args, "--connection")
			?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
			?? Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING");

		if (string.IsNullOrWhiteSpace(connectionString)) {
			throw new InvalidOperationException(
				"No SQL connection string was found for design-time migration execution. " +
				"Set ConnectionStrings__DefaultConnection or AZURE_SQL_CONNECTION_STRING.");
		}

		DbContextOptionsBuilder<ApplicationDbContext> optionsBuilder =
			new DbContextOptionsBuilder<ApplicationDbContext>();
		optionsBuilder.UseSqlServer(connectionString);

		return new ApplicationDbContext(optionsBuilder.Options);
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
