using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for resending the email confirmation link.
/// </summary>
public class ResendConfirmationRequest {
	/// <summary>
	/// Gets or sets the email address to resend confirmation to.
	/// </summary>
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;
}
