using System.Collections.ObjectModel;
using ApplicationTracker.Components.Dialogs;
using ApplicationTracker.Models;
using ApplicationTracker.Services;
using ApplicationTracker.Utilities.Enums;
using Microsoft.AspNetCore.Components;
using MudBlazor;
using SQLite;

namespace ApplicationTracker.Components.DataGrids;

public partial class ApplicationDataGrid : ComponentBase {
	[Inject]
	private DatabaseService Database { get; set; } = null!;

	[Inject]
	private ISnackbar Snackbar { get; set; } = null!;

	[Inject]
	private IDialogService DialogService { get; set; } = null!;

	private ObservableCollection<ApplicationRecord> _applicationRecords = [];
	private string _searchString = string.Empty;
	private MudDataGrid<ApplicationRecord>? _applicationGrid;

	[Parameter]
	public bool IsLoading { get; set; }

	[Parameter]
	public EventCallback<bool> IsLoadingChanged { get; set; }

	private async Task SetLoading(bool value) {
		IsLoading = value;
		await IsLoadingChanged.InvokeAsync(value);
	}

	/// <summary>
	/// Filter globally across multiple columns with the same input.
	/// Used in conjunction with MudBlazor DataGrid's QuickFilter property.
	/// </summary>
	private Func<ApplicationRecord, bool> QuickFilter => record => {
		if (string.IsNullOrWhiteSpace(_searchString)) {
			return true;
		}

		if (record.CompanyName.Contains(_searchString, StringComparison.OrdinalIgnoreCase)) {
			return true;
		}

		if (record.Status.ToString().Contains(_searchString, StringComparison.OrdinalIgnoreCase)) {
			return true;
		}

		return false;
	};

	/// <summary>
	/// Called when the component is initialized.
	/// Retrieves application records from the database.
	/// </summary>
	/// <returns>A task representing the asynchronous operation.</returns>
	protected override async Task OnInitializedAsync() {
		await SetLoading(true);
		try {
			_applicationRecords = new(await Database.GetApplicationRecordsAsync());
		} catch (Exception ex) {
			Console.Error.WriteLine($"An error occurred while retrieving application records: {ex.Message}");
			Snackbar.Add("An error occurred while retrieving application records.", Severity.Error);
		} finally {
			await SetLoading(false);
		}
	}

	/// <summary>
	/// Handles the creation of a new application record.
	/// </summary>
	/// <returns>A task representing the asynchronous operation.</returns>
	private async Task NewRecordAsync() {
		if (_applicationGrid is null || IsLoading) {
			return; // Grid is not ready or still loading
		}

		ApplicationRecord record = new();
		await _applicationGrid.SetEditingItemAsync(record);
	}

	/// <summary>
	/// Handles the creation of a new application record.
	/// Opens a custom dialog for mobile view.
	/// </summary>
	private async Task MobileNewRecordAsync() {
		// TODO fix this
		ApplicationRecord record = new();


	}

	/// <summary>
	/// Handles the committing of changes to an application record.
	/// Saves new records to the database or updates existing ones.
	/// </summary>
	/// <param name="item">The application record to save.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	private async Task CommittedItemChangesAsync(ApplicationRecord item) {
		if (IsLoading) {
			return;
		}

		await SetLoading(true);
		try {
			bool isNewRecord = item.Id == 0;
			// Format URL before saving
			FormatUrl(item);

			// Save to database
			int savedId = await Database.SaveApplicationRecordAsync(item);
			// Fetch the saved/updated record
			ApplicationRecord savedItem = await Database.GetApplicationRecordAsync(savedId)
				?? throw new InvalidOperationException($"Failed to retrieve record with ID {savedId}");

			// Update UI collection
			if (isNewRecord) {
				_applicationRecords.Add(savedItem);
			} else {
				UpdateExistingRecord(item, savedItem);
			}

			Snackbar.Add("Application saved successfully!", Severity.Success);
		} catch (SQLiteException ex) {
			Console.Error.WriteLine($"Database error: {ex.Message}");
			Snackbar.Add("Database error occurred. Please try again.", Severity.Error);
		} catch (InvalidOperationException ex) {
			Console.Error.WriteLine($"Data integrity error: {ex.Message}");
			Snackbar.Add("Failed to retrieve saved record. Please refresh the page.", Severity.Error);
		} catch (Exception ex) {
			Console.Error.WriteLine($"Unexpected error: {ex.Message}");
			Snackbar.Add("An unexpected error occurred while saving.", Severity.Error);
		} finally {
			await SetLoading(false);
			StateHasChanged();
		}
	}

	/// <summary>
	/// Updates an existing record in the collection.
	/// </summary>
	/// <param name="oldItem">The original item to replace.</param>
	/// <param name="newItem">The updated item from the database.</param>
	private void UpdateExistingRecord(ApplicationRecord oldItem, ApplicationRecord newItem) {
		int index = _applicationRecords
			.Select((r, i) => (Record: r, Index: i))
			.FirstOrDefault(x => x.Record.Id == oldItem.Id).Index;

		if (index >= 0) {
			_applicationRecords[index] = newItem;
		} else {
			// Item was removed from collection during save
			Snackbar.Add("Record was modified during save. Changes saved to database.", Severity.Warning);
		}
	}

	/// <summary>
	/// Handles moving an application to the next step in the process.
	/// </summary>
	/// <param name="item"></param>
	private async Task NextStep(ApplicationRecord item) {
		await SetLoading(true);
		try {
			switch (item.Status) {
				case ApplicationStatus.Applied:
					item.Status = ApplicationStatus.Interviewing;
					await Database.SaveApplicationRecordAsync(item);
					Snackbar.Add($"Moved application for {item.CompanyName} to Interviewing", Severity.Info);
					break;
				case ApplicationStatus.Interviewing:
					item.Status = ApplicationStatus.Offered;
					await Database.SaveApplicationRecordAsync(item);
					Snackbar.Add($"Moved application for {item.CompanyName} to Offered", Severity.Info);
					break;
				default:
					Snackbar.Add($"Unknown status for {item.CompanyName}.", Severity.Error);
					break;
			}
		} catch (SQLiteException ex) {
			Console.Error.WriteLine($"Database error: {ex.Message}");
			Snackbar.Add("Database error occurred. Please try again.", Severity.Error);
		} catch (Exception ex) {
			Console.Error.WriteLine($"Unexpected error: {ex.Message}");
			Snackbar.Add("An unexpected error occurred while updating status.", Severity.Error);
		} finally {
			await SetLoading(false);
		}
	}

	/// <summary>
	/// Handles rejecting an application.
	/// </summary>
	/// <param name="item"></param>
	private async Task Reject(ApplicationRecord item) {
		try {
			item.Status = ApplicationStatus.Rejected;
			await Database.SaveApplicationRecordAsync(item);
			Snackbar.Add($"Rejected application for {item.CompanyName}", Severity.Error);
		} catch (SQLiteException ex) {
			Console.Error.WriteLine($"Database error: {ex.Message}");
			Snackbar.Add("Database error occurred. Please try again.", Severity.Error);
		} catch (Exception ex) {
			Console.Error.WriteLine($"Unexpected error: {ex.Message}");
			Snackbar.Add("An unexpected error occurred while updating status.", Severity.Error);
		}
	}

	/// <summary>
	/// Handles deletes the specified application record from the database and removes it from the local collection.
	/// </summary>
	/// <remarks>Displays a notification indicating the result of the operation. If a database or unexpected error
	/// occurs, an error message is shown to the user.</remarks>
	/// <param name="item">The application record to delete. Cannot be null.</param>
	/// <returns>A task that represents the asynchronous delete operation.</returns>
	private async Task Delete(ApplicationRecord item) {
		try {
			await Database.DeleteApplicationRecordAsync(item);
			_applicationRecords.Remove(item);
			Snackbar.Add($"Removed application for {item.CompanyName}", Severity.Warning);
		} catch (SQLiteException ex) {
			Console.Error.WriteLine($"Database error: {ex.Message}");
			Snackbar.Add("Database error occurred. Please try again.", Severity.Error);
		} catch (Exception ex) {
			Console.Error.WriteLine($"Unexpected error: {ex.Message}");
			Snackbar.Add("An unexpected error occurred while removing record.", Severity.Error);
		}
	}

	/// <summary>
	/// Validates that the provided URL is in a valid format.
	/// </summary>
	/// <param name="url">The URL to validate.</param>
	/// <returns>An error message if invalid, null if valid.</returns>
	private string ValidateUrl(string? url) {
		// Allow empty/null for optional field
		if (string.IsNullOrWhiteSpace(url)) {
			return string.Empty;
		}

		// Try to parse as absolute URI
		if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) {
			return "Please enter a valid URL (e.g., https://example.com)";
		}

		// Ensure it's http or https
		if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) {
			return "URL must start with http:// or https://";
		}

		return string.Empty;
	}

	/// <summary>
	/// Auto-formats URL by adding https:// if protocol is missing.
	/// </summary>
	/// <param name="item">The application record to format.</param>
	private void FormatUrl(ApplicationRecord item) {
		if (string.IsNullOrWhiteSpace(item.PostingURL)) {
			return;
		}

		// Trim whitespace
		item.PostingURL = item.PostingURL.Trim();

		// Add https:// if no protocol specified
		if (!item.PostingURL.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
			!item.PostingURL.StartsWith("https://", StringComparison.OrdinalIgnoreCase)) {
			item.PostingURL = "https://" + item.PostingURL;
		}
	}

	/// <summary>
	/// Handles opening the notes dialog for the specified application record.
	/// </summary>
	/// <param name="item"></param>
	private async Task OpenNotesDialogAsync(ApplicationRecord item) {
		DialogParameters parameters = new DialogParameters<NotesDialog> {{nameof(item.Notes), item.Notes}};
		DialogOptions options = new() {
			MaxWidth = MaxWidth.ExtraLarge,
			BackdropClick = false
		};

		IDialogReference dialog = await DialogService.ShowAsync<NotesDialog>("Notes", parameters, options);
		DialogResult? result = await dialog.Result;

		if (result != null && !result.Canceled) {
			// Update notes
			try {
				item.Notes = result.Data as string;
				await Database.SaveApplicationRecordAsync(item);
				Snackbar.Add("Notes updated successfully!", Severity.Success);
			} catch (SQLiteException ex) {
				Console.Error.WriteLine($"Database error: {ex.Message}");
				Snackbar.Add("Database error occurred. Please try again.", Severity.Error);
			} catch (Exception ex) {
				Console.Error.WriteLine($"An error occurred while saving notes: {ex.Message}");
				Snackbar.Add("An error occurred while saving notes.", Severity.Error);
			}
		}
	}

	/// <summary>
	/// Handles row click event for mobile DataGrid.
	/// Opens the application details dialog.
	/// </summary>
	/// <param name="args">The row click event arguments containing the clicked item.</param>
	private async Task OnRowClick(DataGridRowClickEventArgs<ApplicationRecord> args) {
		ApplicationRecord item = args.Item;

		DialogParameters<ApplicationDetailsDialog> parameters = new() {
			{ x => x.Application, item }
		};
		DialogOptions options = new() {
			MaxWidth = MaxWidth.ExtraLarge,
			FullScreen = true,
			BackdropClick = false
		};

		IDialogReference dialog = await DialogService.ShowAsync<ApplicationDetailsDialog>(
			null, parameters, options);
		DialogResult? result = await dialog.Result;

		if (result != null && !result.Canceled) {
			item = (result.Data as ApplicationRecord)!;
			await CommittedItemChangesAsync(item);
		}
	}
}

