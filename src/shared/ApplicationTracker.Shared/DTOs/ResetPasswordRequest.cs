using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for resetting a user's password with a token.
/// </summary>
public class ResetPasswordRequest {
	/// <summary>
	/// Gets or sets the email address.
	/// </summary>
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the password reset token.
	/// </summary>
	[Required]
	public string Token { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the new password.
	/// </summary>
	[Required]
	[MinLength(6)]
	public string NewPassword { get; set; } = string.Empty;
}
