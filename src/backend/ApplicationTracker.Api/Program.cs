using ApplicationTracker.Api.Services;
using ApplicationTracker.Core.Interfaces.Services;
using ApplicationTracker.Infrastructure;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

// Register DI for services
builder.Services.AddScoped<IApplicationRecordService, ApplicationRecordService>();
builder.Services.AddScoped<IExcelImportService, ExcelImportService>();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment()) {
	app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
