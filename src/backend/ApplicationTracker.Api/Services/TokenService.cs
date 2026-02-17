using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ApplicationTracker.Core.Interfaces.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Service for generating JWT access tokens and refresh tokens.
/// </summary>
public class TokenService(IConfiguration configuration) : ITokenService {
	/// <inheritdoc />
	public string GenerateAccessToken(IdentityUser user) {

		// NOTES: key here will come from user-secrets for dev and secret handler by ci/cd when deploy
		// the key will be generated separately
		string key = configuration["Jwt:Key"]
		             ?? throw new InvalidOperationException("JWT key is not configured.");

		SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(key));
		SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

		List<Claim> claims = [
			new(JwtRegisteredClaimNames.Sub, user.Id),
			new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
			new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
		];

		int expiryMinutes = int.Parse(configuration["Jwt:ExpiryInMinutes"] ?? "15");

		JwtSecurityToken token = new(
			issuer: configuration["Jwt:Issuer"],
			audience: configuration["Jwt:Audience"],
			claims: claims,
			expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
			signingCredentials: credentials
		);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <inheritdoc />
	public string GenerateRefreshToken() {
		byte[] randomBytes = new byte[64];
		using RandomNumberGenerator rng = RandomNumberGenerator.Create();
		rng.GetBytes(randomBytes);
		return Convert.ToBase64String(randomBytes);
	}
}
