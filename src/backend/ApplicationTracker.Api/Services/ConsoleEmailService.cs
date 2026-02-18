using ApplicationTracker.Core.Interfaces.Services;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Development email service that logs emails to the console.
/// Replace with SMTP/SendGrid implementation for production.
/// </summary>
public class ConsoleEmailService(ILogger<ConsoleEmailService> logger) : IEmailService {
	/// <inheritdoc />
	public Task SendAsync(string to, string subject, string body) {
		logger.LogInformation(
			"========== EMAIL ==========\nTo: {To}\nSubject: {Subject}\n{Body}\n===========================",
			to, subject, body);
		return Task.CompletedTask;
	}
}
