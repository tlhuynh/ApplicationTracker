using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for initiating a password reset.
/// </summary>
public class ForgotPasswordRequest {
	/// <summary>
	/// Gets or sets the email address of the account to reset.
	/// </summary>
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;
}
