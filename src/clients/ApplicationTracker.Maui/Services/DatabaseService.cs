using ApplicationTracker.Models;
using ApplicationTracker.Utilities.Constants;
using SQLite;

namespace ApplicationTracker.Services;

/// <summary>
/// Provides database operations for managing application records in SQLite.
/// Implements async/await pattern for non-blocking database access.
/// </summary>
public class DatabaseService {
    // TODO:
    // Implement proper error handling and logging for database operations.
    // Look into WOL-Async pattern for better performance with SQLite in mobile environments. https://www.sqlite.org/wal.html
    private SQLiteAsyncConnection? _database;

    /// <summary>
    /// Initializes the SQLite database connection and creates the ApplicationRecord table if it doesn't exist.
    /// This method is called automatically before any database operation.
    /// </summary>
    private async Task Init() {
        if (_database is not null) {
            return;
        }

        _database = new SQLiteAsyncConnection(DatabaseConstants.DatabasePath, DatabaseConstants.Flags);
        await _database.CreateTableAsync<ApplicationRecord>();
    }

    /// <summary>
    /// Retrieves all application records from the database.
    /// </summary>
    /// <returns>A list of all application records.</returns>
    public async Task<List<ApplicationRecord>> GetApplicationRecordsAsync() {
        await Init();
        return await _database!.Table<ApplicationRecord>().ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific application record by its ID.
    /// </summary>
    /// <param name="id">The unique identifier of the application record.</param>
    /// <returns>The application record with the specified ID, or null if not found.</returns>
    public async Task<ApplicationRecord?> GetApplicationRecordAsync(int id) {
        await Init();
        return await _database!.Table<ApplicationRecord>().Where(i => i.Id == id).FirstOrDefaultAsync();
    }

    /// <summary>
    /// Saves an application record to the database.
    /// If the record has an ID of 0, it will be inserted as a new record.
    /// Otherwise, the existing record will be updated.
    /// </summary>
    /// <param name="item">The application record to save.</param>
    /// <returns>The ID of the saved application record.</returns>
    public async Task<int> SaveApplicationRecordAsync(ApplicationRecord item) {
        await Init();
		// TODO ensure the EntityBase field is filled properly (CreatedAt, UpdatedAt)

		if (item.Id == 0) {
			// Insert new record
			await _database!.InsertAsync(item);
		} else {
			// Update existing record
			await _database!.UpdateAsync(item);
		}

		return item.Id;
	}

    /// <summary>
    /// Deletes an application record from the database.
    /// </summary>
    /// <param name="item">The application record to delete.</param>
    /// <returns>The number of rows affected (1 for success, 0 for failure).</returns>
    public async Task<int> DeleteApplicationRecordAsync(ApplicationRecord item) {
        await Init();
		// TODO ensure related data is handled properly before deletion (if any) also set isDeleted in EntityBase instead of hard delete
		return await _database!.DeleteAsync(item);
    }
}
