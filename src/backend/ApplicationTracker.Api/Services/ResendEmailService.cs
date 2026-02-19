using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ApplicationTracker.Core.Interfaces.Services;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Production email service that sends emails via the Resend API.
/// </summary>
public class ResendEmailService(HttpClient httpClient, IConfiguration configuration, ILogger<ResendEmailService>
	logger) : IEmailService {
	/// <inheritdoc />
	public async Task SendAsync(string to, string subject, string body) {
		// Should pull from secrets from prod env
		string apiKey = configuration["Resend:ApiKey"]
		                ?? throw new InvalidOperationException("Resend:ApiKey is not configured.");
		string fromAddress = configuration["Resend:FromAddress"]
		                     ?? throw new InvalidOperationException("Resend:FromAddress is not configured.");

		// Reference https://resend.com/docs/api-reference/emails/send-email
		using HttpRequestMessage request = new(HttpMethod.Post, "https://api.resend.com/emails");
		request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

		object payload = new { from = fromAddress, to = new[] { to }, subject, html = body };
		request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

		HttpResponseMessage response = await httpClient.SendAsync(request);

		if (!response.IsSuccessStatusCode) {
			string error = await response.Content.ReadAsStringAsync();
			logger.LogError("Resend API error {StatusCode}: {Error}", response.StatusCode, error);
		}

		response.EnsureSuccessStatusCode();
	}
}
