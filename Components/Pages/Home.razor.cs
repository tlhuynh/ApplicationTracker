using System.Collections.ObjectModel;
using ApplicationTracker.Models;
using ApplicationTracker.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;
using SQLite;

namespace ApplicationTracker.Components.Pages;

public partial class Home {
	[Inject]
	private DatabaseService Database { get; set; } = null!;

	[Inject]
	private ISnackbar Snackbar { get; set; } = null!;

	private ObservableCollection<ApplicationRecord> _applicationRecords = [];
	private string _searchString = string.Empty;
	private MudDataGrid<ApplicationRecord> _applicationGrid = default!;

	private bool _isLoading = false;

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
		_isLoading = true;
		try {
			_applicationRecords = new(await Database.GetApplicationRecordsAsync());
		} catch (Exception ex) {
			Console.Error.WriteLine($"An error occurred while retrieving application records: {ex.Message}");
			Snackbar.Add("An error occurred while retrieving application records.", Severity.Error);
		} finally {
			_isLoading = false;
		}
	}

	/// <summary>
	/// Handles the creation of a new application record.
	/// Opens the DataGrid in edit mode for a new record.
	/// </summary>
	/// <returns>A task representing the asynchronous operation.</returns>
	private async Task NewRecordAsync() {
		if (_applicationGrid is null || _isLoading) {
			return; // Grid is not ready or still loading
		}

		ApplicationRecord record = new();
		await _applicationGrid.SetEditingItemAsync(record);
	}

	/// <summary>
	/// Handles the committing of changes to an application record.
	/// Saves new records to the database or updates existing ones.
	/// </summary>
	/// <param name="item">The application record to save.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	private async Task CommittedItemChangesAsync(ApplicationRecord item) {
		if (_isLoading) {
			return;
		}

		_isLoading = true;
		try {
			// Save to database
			int savedId = await Database.SaveApplicationRecordAsync(item);

			// Fetch the saved/updated record
			ApplicationRecord? savedItem = await Database.GetApplicationRecordAsync(savedId)
				?? throw new InvalidOperationException($"Failed to retrieve record with ID {savedId}");

			// Update UI collection
			if (item.Id == 0) {
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
			_isLoading = false;
			StateHasChanged();
		}
	}

	/// <summary>
	/// Updates an existing record in the collection.
	/// </summary>
	/// <param name="oldItem">The original item to replace.</param>
	/// <param name="newItem">The updated item from the database.</param>
	private void UpdateExistingRecord(ApplicationRecord oldItem, ApplicationRecord newItem) {
		int index = _applicationRecords.IndexOf(oldItem);
		if (index >= 0) {
			_applicationRecords[index] = newItem;
		} else {
			// Item was removed from collection during save
			Snackbar.Add("Record was modified during save. Changes saved to database.", Severity.Warning);
		}
	}
}
