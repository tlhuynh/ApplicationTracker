using System.ComponentModel.DataAnnotations;

namespace ApplicationTracker.Shared.Validation;

/// <summary>
/// Validates that a <see cref="DateTime"/> value does not represent a future date.
/// Null values pass validation — use <see cref="RequiredAttribute"/> separately if the field is required.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public class NotFutureDateAttribute : ValidationAttribute {
	/// <inheritdoc />
	protected override ValidationResult? IsValid(object? value, ValidationContext validationContext) {
		if (value is DateTime date && date.Date > DateTime.UtcNow.Date) {
			return new ValidationResult("Applied date cannot be in the future.");
		}

		return ValidationResult.Success;
	}
}
