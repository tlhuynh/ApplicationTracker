using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ApplicationTracker.Api.Transformers;

/// <summary>
/// Adds JWT Bearer security scheme to the OpenAPI document so Scalar shows an auth input.
/// </summary>
internal sealed class BearerSecuritySchemeTransformer(
	IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer {
	/// <inheritdoc />
	public async Task TransformAsync(
		OpenApiDocument document,
		OpenApiDocumentTransformerContext context,
		CancellationToken cancellationToken) {
		IEnumerable<AuthenticationScheme> authenticationSchemes =
			await authenticationSchemeProvider.GetAllSchemesAsync();

		if (authenticationSchemes.Any(authScheme => authScheme.Name == "Bearer")) {
			Dictionary<string, IOpenApiSecurityScheme> requirements  = new() {
				["Bearer"] = new OpenApiSecurityScheme {
					Type = SecuritySchemeType.Http,
					Scheme = "bearer",
					In = ParameterLocation.Header,
					BearerFormat = "Json Web Token"
				}
			};
			document.Components ??= new OpenApiComponents();
			document.Components.SecuritySchemes = requirements;
		}
	}
}
