namespace ApplicationTracker.Core.Entities;

/// <summary>
/// Represents a refresh token issued to a user for obtaining new access tokens.
/// </summary>
public class RefreshToken {
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Gets or sets the token value.
	/// </summary>
	public string Token { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the Identity user ID this token belongs to.
	/// </summary>
	public string UserId { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the expiration date in UTC.
	/// </summary>
	public DateTime ExpiresAt { get; set; }

	/// <summary>
	/// Gets or sets whether this token has been revoked.
	/// </summary>
	public bool IsRevoked { get; set; }

	/// <summary>
	/// Gets or sets the date this token was created.
	/// </summary>
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
