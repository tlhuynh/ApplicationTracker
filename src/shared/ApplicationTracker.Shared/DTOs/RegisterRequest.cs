using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for user registration.
/// </summary>
public class RegisterRequest {
	/// <summary>
	/// Gets or sets the email address (used as the username).
	/// </summary>
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the password.
	/// </summary>
	[Required]
	[MinLength(6)]
	public string Password { get; set; } = string.Empty;
}
