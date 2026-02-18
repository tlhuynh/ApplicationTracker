namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service for sending emails (confirmation, password reset, etc.).
/// </summary>
public interface IEmailService {
	/// <summary>
	/// Sends an email to the specified recipient.
	/// </summary>
	/// <param name="to">The recipient email address.</param>
	/// <param name="subject">The email subject line.</param>
	/// <param name="body">The email body (HTML or plain text).</param>
	Task SendAsync(string to, string subject, string body);
}
