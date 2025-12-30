# GitHub Copilot Instructions for ApplicationTracker

## Project Context

This is a .NET MAUI Blazor Hybrid application targeting .NET 8 with cross-platform support for Android, iOS, macOS (Catalyst), and Windows.

## Code Style Requirements

### Formatting Rules (Enforced by .editorconfig)

- **Use explicit types** instead of `var`
- **Braces on same line** (K&R style)
- **File-scoped namespaces** for all C# files
- **4-space indentation** for C#, Razor, and XAML files
- **XAML properties on separate lines**, vertically aligned

### Example C# Code Style

```csharp
namespace ApplicationTracker;

public class ExampleService {
    private readonly ILogger<ExampleService> _logger;

    public ExampleService(ILogger<ExampleService> logger) {
        _logger = logger;
    }

    public async Task<Result> ProcessDataAsync(string input) {
        if (string.IsNullOrEmpty(input)) {
            return Result.Failure("Input cannot be empty");
        }

        // Use explicit types instead of var
        List<string> items = await GetItemsAsync();
        Dictionary<string, int> results = ProcessItems(items);
        
        return Result.Success(results);
    }
}
```

### Example XAML Style

```xaml
<Button Text="Click Me"
        Command="{Binding SubmitCommand}"
        BackgroundColor="{StaticResource PrimaryColor}"
        TextColor="White"
        WidthRequest="200"
        HeightRequest="50" />
```

## Project-Specific Guidance

### Technology Stack

- **.NET 8** (LTS - supported until November 2026)
- **.NET MAUI** for cross-platform UI
- **Blazor** for web-style component development
- **C# 12** language features
- **Target Platforms**: Android, iOS, macOS Catalyst, Windows

### Naming Conventions

- **Private fields**: `_camelCase` with underscore prefix
- **Public properties/methods**: `PascalCase`
- **Interfaces**: `IPascalCase` with 'I' prefix
- **Local variables**: `camelCase`
- **Constants**: `PascalCase`

### Architecture Patterns

- Use **Dependency Injection** for services
- Follow **MVVM pattern** for Blazor components where appropriate
- Keep platform-specific code in `Platforms/` folders
- Shared code in root and `Components/` folders

### Code Quality

- Always include XML documentation for public APIs
- Use nullable reference types (`enable` in project)
- Prefer `async/await` for asynchronous operations
- Use pattern matching and modern C# 12 features
- No use of `ConfigureAwait(false)` in MAUI apps (not needed)

### Common Patterns

```csharp
// Service registration in MauiProgram.cs
builder.Services.AddSingleton<IDataService, DataService>();
builder.Services.AddTransient<IViewModel, ViewModel>();

// Blazor component with dependency injection
@inject IDataService DataService
@inject ILogger<MyComponent> Logger

// Error handling
try {
    Result result = await _service.ProcessAsync();
    if (!result.IsSuccess) {
        _logger.LogWarning("Processing failed: {Error}", result.Error);
    }
} catch (Exception ex) {
    _logger.LogError(ex, "Unexpected error during processing");
}
```

## Response Requirements

### Always Include at End of Response

When providing code examples, explanations, or solutions, **always include a "References" section** at the end with:

1. **Official Documentation Links**
   - Link to relevant Microsoft Docs
   - .NET MAUI documentation
   - C# language reference

2. **Code Sources**
   - Files referenced or modified
   - Packages or NuGet references used

3. **Related Patterns or Best Practices**
   - MAUI community samples
   - Design pattern references

### Example References Section

```markdown
## 📚 References

### Official Documentation
- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid Apps](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [Dependency Injection in .NET](https://learn.microsoft.com/dotnet/core/extensions/dependency-injection)

### Files Modified
- `MauiProgram.cs` - Service registration
- `Components/Pages/Home.razor` - UI implementation

### Related Resources
- [MAUI Community Toolkit](https://github.com/CommunityToolkit/Maui)
- [C# 12 What's New](https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-12)
```

## Avoid

- ❌ Using `var` keyword (use explicit types)
- ❌ Braces on new lines
- ❌ Traditional namespaces with braces
- ❌ Xamarin.Forms references (use MAUI equivalents)
- ❌ `ConfigureAwait(false)` in MAUI apps
- ❌ Responses without references section

## Common MAUI Gotchas

- **Platform-specific code**: Use conditional compilation or platform-specific folders
- **Android permissions**: Declare in `AndroidManifest.xml`
- **iOS entitlements**: Configure in `Entitlements.plist`
- **Hot Reload**: Supported for XAML and Blazor, limited for C#
- **Resource paths**: Use forward slashes in MAUI resource URIs

## Testing Guidance

When providing test code:
- Use **xUnit** as the preferred testing framework
- Follow AAA pattern (Arrange, Act, Assert)
- Use explicit assertion messages
- Mock dependencies with interfaces

---

**Remember**: Always end responses with a "References" section listing documentation, files, and related resources used or referenced in the answer.
