using ApplicationTracker.Api.Services;

namespace ApplicationTracker.Api.Tests.Services;

/// <summary>
/// Unit tests for <see cref="RefreshTokenHasher"/>.
/// </summary>
public class RefreshTokenHasherTests {
	[Fact]
	public void Hash_ReturnsDeterministicLowercaseHexLength64() {
		string plain = "test-refresh-token-value";

		string hash1 = RefreshTokenHasher.Hash(plain);
		string hash2 = RefreshTokenHasher.Hash(plain);

		Assert.Equal(64, hash1.Length);
		Assert.Equal(hash1, hash2);
		Assert.Equal(hash1, hash1.ToLowerInvariant());
	}

	[Fact]
	public void Hash_DifferentInputsProduceDifferentHashes() {
		string a = RefreshTokenHasher.Hash("a");
		string b = RefreshTokenHasher.Hash("b");

		Assert.NotEqual(a, b);
	}
}
