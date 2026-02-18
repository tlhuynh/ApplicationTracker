using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Infrastructure.Data;
using ApplicationTracker.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
			$"Please confirm your email by clicking the link:\n{confirmationLink}");

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
			RefreshToken refreshToken = new() {
				Token = refreshTokenValue, UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(7)
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
		RefreshToken? stored = await dbContext.RefreshTokens
			.FirstOrDefaultAsync(rt => rt.Token == refreshToken
			                           && !rt.IsRevoked
			                           && rt.ExpiresAt > DateTime.UtcNow);

		if (stored is null) {
			return Unauthorized("Invalid or expired refresh token.");
		}

		IdentityUser? user = await userManager.FindByIdAsync(stored.UserId);
		if (user is null) {
			return Unauthorized("User not found.");
		}

		// Revoke old refresh token and issue new ones (rotation)
		stored.IsRevoked = true;
		string newAccessToken = tokenService.GenerateAccessToken(user);
		string newRefreshTokenValue = tokenService.GenerateRefreshToken();

		dbContext.RefreshTokens.Add(new RefreshToken {
			Token = newRefreshTokenValue, UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(7)
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
		RefreshToken? stored = await dbContext.RefreshTokens
			.FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

		if (stored is not null) {
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
                $"Please confirm your email by clicking the link:\n{confirmationLink}");

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
                $"Reset your password by clicking the link:\n{resetLink}");

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

        return Ok("Password has been reset successfully. You can now log in.");
  }
}
