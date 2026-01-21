# Application Tracker

A cross-platform application tracker built with .NET MAUI Blazor and MudBlazor.

## Technologies

- **.NET 10 Preview**
- **.NET MAUI** - Cross-platform UI framework
- **Blazor Hybrid** - Web UI components within MAUI
- **MudBlazor** - Material Design component library
- **C# 13** - Latest C# features

## Platforms

- Android
- iOS
- macOS (Catalyst)
- Windows

## Prerequisites

### Windows
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Visual Studio 2022 (17.12+)](https://visualstudio.microsoft.com/) with:
  - .NET MAUI workload
  - Android SDK
  - Windows SDK

### macOS
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Visual Studio 2022 for Mac](https://visualstudio.microsoft.com/vs/mac/) or [VS Code](https://code.visualstudio.com/)
- [Xcode 15+](https://developer.apple.com/xcode/) (for iOS/macOS development)
- Command Line Tools: `xcode-select --install`

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/tlhuynh/ApplicationTracker.git
cd ApplicationTracker
```

### 2. Install Workloads

**On Windows:**
```powershell
dotnet workload restore
```

**On macOS:**
```bash
dotnet workload restore
```

### 3. Restore Dependencies
```bash
dotnet restore
```

### 4. Run the Application

**Visual Studio (Windows/Mac):**
- Open `ApplicationTracker.sln`
- Select target platform (Android/iOS/Windows/macOS)
- Press `F5` or click Run

**Command Line:**
```bash
# Build
dotnet build

# Run on specific platform
dotnet build -f net10.0-android
dotnet build -f net10.0-ios
dotnet build -f net10.0-maccatalyst
dotnet build -f net10.0-windows10.0.19041.0  # Windows only
```

## Project Structure

```
ApplicationTracker/
├── Components/              # Blazor components
│   ├── Layout/             # Layout components (MainLayout, NavMenu)
│   └── Pages/              # Page components (Home, Counter, Weather)
├── Platforms/              # Platform-specific code
│   ├── Android/
│   ├── iOS/
│   ├── MacCatalyst/
│   └── Windows/
├── Resources/              # App resources
│   ├── AppIcon/           # Application icon
│   ├── Fonts/             # Custom fonts
│   ├── Images/            # Images
│   └── Splash/            # Splash screen
├── wwwroot/               # Static web assets
│   ├── css/
│   └── index.html         # Blazor host page
├── App.xaml               # Application entry point
├── MainPage.xaml          # Main MAUI page with BlazorWebView
├── MauiProgram.cs         # App configuration & DI
├── global.json            # SDK version pinning
└── .editorconfig          # Code formatting rules
```

## MudBlazor Components

This project uses [MudBlazor](https://mudblazor.com/) for Material Design UI components.
See [MudBlazor Documentation](https://mudblazor.com/components) for more

## Resources

- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid Documentation](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [MudBlazor Documentation](https://mudblazor.com/)
- [.NET 10 Preview](https://dotnet.microsoft.com/download/dotnet/10.0)
