# Application Tracker

A cross-platform application tracker built with .NET MAUI and Blazor.

## 🚀 Technologies

- **.NET 8**
- **.NET MAUI** - Cross-platform UI framework
- **Blazor** - Web UI components within MAUI
- **C# 12** - Latest C# features

## 🎯 Platforms

- ✅ Android
- ✅ iOS
- ✅ macOS (Catalyst)
- ✅ Windows

## 🛠️ Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Visual Studio 2022 (17.8+) with MAUI workload
- For specific platforms:
  - **Android**: Android SDK
  - **iOS/macOS**: Xcode (macOS only)
  - **Windows**: Windows 10/11 SDK

## 🏃 Getting Started

### Clone the repository
```bash
git clone https://github.com/tlhuynh/ApplicationTracker.git
cd ApplicationTracker
```

### Restore dependencies
```bash
dotnet restore
```

### Run the application
```bash
dotnet build
dotnet run
```

Or open `ApplicationTracker.sln` in Visual Studio 2022 and press F5.

## 📁 Project Structure

```
ApplicationTracker/
├── Components/          # Blazor components
├── wwwroot/            # Static web assets
├── Resources/          # Images, fonts, splash screens
│   ├── AppIcon/
│   ├── Fonts/
│   ├── Images/
│   └── Splash/
├── App.xaml           # Application entry point
├── MainPage.xaml      # Main MAUI page with Blazor WebView
└── MauiProgram.cs     # App configuration
```

## 🔧 Code Style

This project uses `.editorconfig` for consistent code formatting:
- File-scoped namespaces
- Explicit types (no `var`)
- Braces on same line
- XAML properties on separate lines

To format code: **Ctrl+K, Ctrl+D** in Visual Studio

## 📝 License

[Add your license here]

## 👥 Contributing

[Add contributing guidelines if applicable]
