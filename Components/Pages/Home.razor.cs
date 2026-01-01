using ApplicationTracker.Models;
using ApplicationTracker.Services;
using ApplicationTracker.Utilities.Enums;
using Microsoft.AspNetCore.Components;

namespace ApplicationTracker.Components.Pages;

public partial class Home {
	[Inject]
	private DatabaseService Database { get; set; } = null!;

	private IEnumerable<ApplicationRecord> _applicationRecords = [];
	private string _searchString = string.Empty;
	private bool _readOnly = true;

	/// <summary>
	/// Filter globally across multiple columns with the same input.
	/// Used in conjunction with Blazorise DataGrid's built-in filtering capabilities,
	/// hence, this is a Func delegate instead of a simple method.
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
	/// <returns></returns>
	protected override async Task OnInitializedAsync () {
		//_applicationRecords = await Database.GetApplicationRecordsAsync();
		await Task.Delay(500); // Simulate async data fetching
		_applicationRecords = [
			new ApplicationRecord {
				Id = 1,
				CompanyName = "Contoso",				
				Status = ApplicationStatus.Applied,
				AppliedDate = DateTime.Now.AddDays(-10)
			},
			new ApplicationRecord {
				Id = 2,
				CompanyName = "Fabrikam",
				Status = ApplicationStatus.Interviewing,
				AppliedDate = DateTime.Now.AddDays(-5)
			},
			new ApplicationRecord {
				Id = 3,
				CompanyName = "Adventure Works",
				Status = ApplicationStatus.Offered,
				AppliedDate = DateTime.Now.AddDays(-20)
			}
		];
	}

	/// <summary>
	/// Handles changes to the collection of selected application records.
	/// </summary>
	/// <param name="selectedItems">A set containing the currently selected application records. Cannot be null.</param>
	private void SelectedItemsChanged(HashSet<ApplicationRecord> selectedItems) {
		// Handle selected items change
	}

}
