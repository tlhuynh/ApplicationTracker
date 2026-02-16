using System.Text;
using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Infrastructure;
using ApplicationTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options => {
	options.AddDefaultPolicy(policy => {
		policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
			.AllowAnyHeader()
			.AllowAnyMethod();
	});
});

builder.Services.AddInfrastructure(builder.Configuration);

// Identity and JWT configuration
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => {
		// Tighten these rules when use for production
		options.Password.RequiredLength = 6;
		options.Password.RequireDigit = false;
		options.Password.RequireNonAlphanumeric = false;
		options.Password.RequireUppercase = false;
		options.Password.RequireLowercase = false;
		options.User.RequireUniqueEmail = true;
	})
	.AddEntityFrameworkStores<ApplicationDbContext>()
	.AddDefaultTokenProviders();

// NOTES: about this key, can come up ourselves or generate it randomly for better secure
// For dev, we can generate once and keep forever. For Prod, ideally it should be changed periodically. When it happened
// all previous keys will be invalid and required re-authenticate.
string jwtKey = builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key is not configured.");

builder.Services.AddAuthentication(options => {
		options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
		options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
	})
	.AddJwtBearer(options => {
		options.TokenValidationParameters = new TokenValidationParameters {
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = builder.Configuration["Jwt:Issuer"],
			ValidAudience = builder.Configuration["Jwt:Audience"],
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
		};
	});

builder.Services.AddAuthorization();

// Register DI for services
builder.Services.AddScoped<IApplicationRecordService, ApplicationRecordService>();
builder.Services.AddScoped<IExcelImportService, ExcelImportService>();
builder.Services.AddScoped<ITokenService, TokenService>();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment()) {
	app.MapOpenApi();
	app.MapScalarApiReference();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
