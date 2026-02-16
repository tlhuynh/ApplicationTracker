using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for user login.
/// </summary>
public class LoginRequest {
	/// <summary>
	/// Gets or sets the email address.
	/// </summary>
	[Required]
	[EmailAddress]
	public string Email { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the password.
	/// </summary>
	[Required]
	public string Password { get; set; } = string.Empty;
}
