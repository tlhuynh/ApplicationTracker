using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Infrastructure;
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

// Register DI for services
builder.Services.AddScoped<IApplicationRecordService, ApplicationRecordService>();
builder.Services.AddScoped<IExcelImportService, ExcelImportService>();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment()) {
	app.MapOpenApi();
	app.MapScalarApiReference();
}

app.UseCors();
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
