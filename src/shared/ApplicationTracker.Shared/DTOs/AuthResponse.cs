namespace ApplicationTracker.Shared.DTOs;

/// <summary>
/// Response model returned after successful authentication.
/// </summary>
public class AuthResponse {
	/// <summary>
	/// Gets or sets the JWT access token.
	/// </summary>
	public string AccessToken { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the refresh token for obtaining new access tokens.
	/// </summary>
	public string RefreshToken { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the access token expiration time in UTC.
	/// </summary>
	public DateTime ExpiresAt { get; set; }
}
