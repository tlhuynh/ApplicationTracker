using System.Security.Cryptography;
using System.Text;

namespace ApplicationTracker.Api.Services;

/// <summary>
/// Computes a deterministic hash for refresh token storage and lookup.
/// </summary>
public static class RefreshTokenHasher {
	/// <summary>
	/// Returns a lowercase hex SHA-256 hash of the UTF-8 encoded refresh token string.
	/// </summary>
	public static string Hash(string refreshTokenPlain) {
		byte[] bytes = Encoding.UTF8.GetBytes(refreshTokenPlain);
		byte[] hash = SHA256.HashData(bytes);
		return Convert.ToHexString(hash).ToLowerInvariant();
	}
}
