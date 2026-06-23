using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Infrastructure.Data;
using ApplicationTracker.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApplicationTracker.Api.Controllers;

/// <summary>
/// Handles user authentication — registration, login, and token refresh.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController(
	UserManager<IdentityUser> userManager,
	ITokenService tokenService,
	IEmailService emailService,
	ApplicationDbContext dbContext,
	IConfiguration configuration) : ControllerBase {
	/// <summary>
	/// Registers a new user account.
	/// </summary>
	[HttpPost("register")]
	public async Task<IActionResult> Register(RegisterRequest request) {
		IdentityUser user = new() { UserName = request.Email, Email = request.Email };

		IdentityResult result = await userManager.CreateAsync(user, request.Password);

		if (!result.Succeeded) {
			return BadRequest(result.Errors.Select(e => e.Description));
		}

		string token = await userManager.GenerateEmailConfirmationTokenAsync(user);
		// Prevent potential issue since token can contains +, /, =
		string encodedToken = Uri.EscapeDataString(token);
		string frontendBaseUrl = configuration["App:FrontendBaseUrl"] ?? "http://localhost:5173";
		string confirmationLink = $"{frontendBaseUrl}/confirm-email?userId={user.Id}&token={encodedToken}";

		await emailService.SendAsync(
			user.Email!,
			"Confirm your email",
			BuildConfirmEmailHtml(confirmationLink));

		return Ok("Registration successful. Please check your email to confirm your account.");
	}

	/// <summary>
	/// Authenticates a user and returns access + refresh tokens.
	/// </summary>
	[HttpPost("login")]
	public async Task<ActionResult<AuthResponse>> Login(LoginRequest request) {
		IdentityUser? user = await userManager.FindByEmailAsync(request.Email);
		if (user is null || !await userManager.CheckPasswordAsync(user, request.Password)) {
			return Unauthorized("Invalid email or password.");
		}

		if (!await userManager.IsEmailConfirmedAsync(user)) {
			return StatusCode(403, "Email not confirmed. Please check your inbox or request a new confirmation link.");
		}

		string accessToken = tokenService.GenerateAccessToken(user);
		int expiryMinutes = int.Parse(configuration["Jwt:ExpiryInMinutes"] ?? "15");

		string refreshTokenValue = string.Empty;

		// NOTES: this would mean the user would need to re-authenticate after 15 mins.
		// Might be better to increase the Access Token a little longer
		if (request.RememberMe) {
			refreshTokenValue = tokenService.GenerateRefreshToken();
			string tokenHash = RefreshTokenHasher.Hash(refreshTokenValue);
			string? securityStamp = await userManager.GetSecurityStampAsync(user);
			RefreshToken refreshToken = new() {
				TokenHash = tokenHash,
				UserId = user.Id,
				ExpiresAt = DateTime.UtcNow.AddDays(7),
				SecurityStamp = securityStamp
			};
			dbContext.RefreshTokens.Add(refreshToken);
			await dbContext.SaveChangesAsync();
		}

		return Ok(new AuthResponse {
			AccessToken = accessToken,
			RefreshToken = refreshTokenValue,
			ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
		});
	}

	/// <summary>
	/// Exchanges a refresh token for a new access token.
	/// </summary>
	[HttpPost("refresh")]
	public async Task<ActionResult<AuthResponse>> Refresh([FromBody] string refreshToken) {
		string tokenHash = RefreshTokenHasher.Hash(refreshToken);
		RefreshToken? stored = await dbContext.RefreshTokens
			.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash
			                           && !rt.IsRevoked
			                           && rt.ExpiresAt > DateTime.UtcNow);

		if (stored is null) {
			return Unauthorized("Invalid or expired refresh token.");
		}

		IdentityUser? user = await userManager.FindByIdAsync(stored.UserId);
		if (user is null) {
			return Unauthorized("User not found.");
		}

		string? currentStamp = await userManager.GetSecurityStampAsync(user);
		if (!string.Equals(stored.SecurityStamp, currentStamp, StringComparison.Ordinal)) {
			return Unauthorized("Invalid or expired refresh token.");
		}

		// Revoke old refresh token and issue new ones (rotation)
		stored.IsRevoked = true;
		string newAccessToken = tokenService.GenerateAccessToken(user);
		string newRefreshTokenValue = tokenService.GenerateRefreshToken();
		string newTokenHash = RefreshTokenHasher.Hash(newRefreshTokenValue);
		string? newSecurityStamp = await userManager.GetSecurityStampAsync(user);

		dbContext.RefreshTokens.Add(new RefreshToken {
			TokenHash = newTokenHash,
			UserId = user.Id,
			ExpiresAt = DateTime.UtcNow.AddDays(7),
			SecurityStamp = newSecurityStamp
		});
		await dbContext.SaveChangesAsync();

		int expiryMinutes = int.Parse(configuration["Jwt:ExpiryInMinutes"] ?? "15");

		return Ok(new AuthResponse {
			AccessToken = newAccessToken,
			RefreshToken = newRefreshTokenValue,
			ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
		});
	}

	/// <summary>
	/// Revokes a refresh token so it can no longer be used.
	/// </summary>
	[Authorize]
	[HttpPost("logout")]
	public async Task<IActionResult> Logout([FromBody] string refreshToken) {
		string? currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (string.IsNullOrEmpty(currentUserId)) {
			return Unauthorized();
		}

		string logoutTokenHash = RefreshTokenHasher.Hash(refreshToken);
		RefreshToken? stored = await dbContext.RefreshTokens
			.FirstOrDefaultAsync(rt => rt.TokenHash == logoutTokenHash && !rt.IsRevoked);

		if (stored is not null) {
			if (stored.UserId != currentUserId) {
				return Forbid();
			}

			stored.IsRevoked = true;
			await dbContext.SaveChangesAsync();
		}

		return NoContent();
	}

	/// <summary>
  /// Confirms a user's email address using the token sent during registration.
  /// </summary>
  [HttpPost("confirm-email")]
  public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest request) {
        IdentityUser? user = await userManager.FindByIdAsync(request.UserId);
        if (user is null) {
                return BadRequest("Invalid confirmation request.");
        }

        IdentityResult result = await userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded) {
                return BadRequest("Invalid or expired confirmation token.");
        }

        List<RefreshToken> confirmTokens = await dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync();
        foreach (RefreshToken rt in confirmTokens) {
                rt.IsRevoked = true;
        }

        if (confirmTokens.Count > 0) {
                await dbContext.SaveChangesAsync();
        }

        return Ok("Email confirmed successfully. You can now log in.");
  }

  /// <summary>
  /// Resends the email confirmation link for an unconfirmed account.
  /// </summary>
  [HttpPost("resend-confirmation")]
  public async Task<IActionResult> ResendConfirmation(ResendConfirmationRequest request) {
        IdentityUser? user = await userManager.FindByEmailAsync(request.Email);

        // Always return Ok to prevent email enumeration
        if (user is null || await userManager.IsEmailConfirmedAsync(user)) {
                return Ok("If an account with that email exists and is unconfirmed, a new confirmation link has been sent.");
        }

        string token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        string encodedToken = Uri.EscapeDataString(token);
        string frontendBaseUrl = configuration["App:FrontendBaseUrl"] ?? "http://localhost:5173";
        string confirmationLink = $"{frontendBaseUrl}/confirm-email?userId={user.Id}&token={encodedToken}";

        await emailService.SendAsync(
                user.Email!,
                "Confirm your email",
                BuildConfirmEmailHtml(confirmationLink));

        return Ok("If an account with that email exists and is unconfirmed, a new confirmation link has been sent.");
  }

  /// <summary>
  /// Sends a password reset link to the specified email address.
  /// </summary>
  [HttpPost("forgot-password")]
  public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request) {
        IdentityUser? user = await userManager.FindByEmailAsync(request.Email);

        // Always return Ok to prevent email enumeration
        if (user is null || !await userManager.IsEmailConfirmedAsync(user)) {
                return Ok("If an account with that email exists, a password reset link has been sent.");
        }

        string token = await userManager.GeneratePasswordResetTokenAsync(user);
        string encodedToken = Uri.EscapeDataString(token);
        string frontendBaseUrl = configuration["App:FrontendBaseUrl"] ?? "http://localhost:5173";
        string resetLink = $"{frontendBaseUrl}/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={encodedToken}";

        await emailService.SendAsync(
                user.Email!,
                "Reset your password",
                BuildResetPasswordHtml(resetLink));

        return Ok("If an account with that email exists, a password reset link has been sent.");
  }

  /// <summary>
  /// Resets a user's password using the token from the forgot password email.
  /// </summary>
  [HttpPost("reset-password")]
  public async Task<IActionResult> ResetPassword(ResetPasswordRequest request) {
        IdentityUser? user = await userManager.FindByEmailAsync(request.Email);
        if (user is null) {
                return BadRequest("Invalid or expired reset token.");
        }

        IdentityResult result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded) {
                return BadRequest(result.Errors.Select(e => e.Description));
        }

        List<RefreshToken> activeTokens = await dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync();
        foreach (RefreshToken refreshTokenEntity in activeTokens) {
                refreshTokenEntity.IsRevoked = true;
        }

        if (activeTokens.Count > 0) {
                await dbContext.SaveChangesAsync();
        }

        return Ok("Password has been reset successfully. You can now log in.");
  }

  private static string BuildConfirmEmailHtml(string confirmationLink) => $"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
      <h2 style="margin:0 0 8px;">Job Apps Tracker</h2>
      <p style="margin:0 0 24px;color:#555;">Confirm your email address to activate your account.</p>
      <a href="{confirmationLink}"
         style="display:inline-block;background-color:#1565c0;color:#fff;padding:12px 28px;
                text-decoration:none;border-radius:4px;font-weight:bold;font-size:15px;">
        Confirm Email
      </a>
      <p style="margin:24px 0 4px;color:#777;font-size:13px;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
        <a href="{confirmationLink}" style="color:#1565c0;">{confirmationLink}</a>
      </p>
      <p style="margin:0;color:#999;font-size:12px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </body>
    </html>
    """;

  private static string BuildResetPasswordHtml(string resetLink) => $"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
      <h2 style="margin:0 0 8px;">Job Apps Tracker</h2>
      <p style="margin:0 0 24px;color:#555;">We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="{resetLink}"
         style="display:inline-block;background-color:#1565c0;color:#fff;padding:12px 28px;
                text-decoration:none;border-radius:4px;font-weight:bold;font-size:15px;">
        Reset Password
      </a>
      <p style="margin:24px 0 4px;color:#777;font-size:13px;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
        <a href="{resetLink}" style="color:#1565c0;">{resetLink}</a>
      </p>
      <p style="margin:0;color:#999;font-size:12px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </body>
    </html>
    """;
}
