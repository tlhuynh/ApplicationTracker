using Microsoft.AspNetCore.Identity;

namespace ApplicationTracker.Core.Interfaces.Services;

/// <summary>
/// Service for generating and validating authentication tokens.
/// </summary>
public interface ITokenService {
	/// <summary>
	/// Generates a JWT access token for the specified user.
	/// </summary>
	/// <param name="user">The Identity user.</param>
	/// <returns>The signed JWT token string.</returns>
	string GenerateAccessToken(IdentityUser user);

	/// <summary>
	/// Generates a cryptographically random refresh token.
	/// </summary>
	/// <returns>A Base64-encoded refresh token string.</returns>
	string GenerateRefreshToken();
}
