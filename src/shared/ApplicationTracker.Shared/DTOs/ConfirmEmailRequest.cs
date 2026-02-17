using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Request model for confirming a user's email address.
/// </summary>
public class ConfirmEmailRequest {
	/// <summary>
	/// Gets or sets the user ID.
	/// </summary>
	[Required]
	public string UserId { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the email confirmation token.
	/// </summary>
	[Required]
	public string Token { get; set; } = string.Empty;
}
