using SQLite;

namespace ApplicationTracker.Models.Entity;

/// <summary>
/// Base class for all database entities.
/// Provides common properties for tracking, synchronization, and multi-tenant support.
/// Optimized for SQLite-NET in MAUI application.
/// Server will have its own entity definitions with EF Core annotations.
/// </summary>
public abstract class BaseEntity {
	/// <summary>
	/// Gets or sets the unique identifier for the entity.
	/// Auto-incremented by SQLite when inserting new records.
	/// </summary>
	[PrimaryKey, AutoIncrement]
	public int Id { get; set; }

	/// <summary>
	/// Gets or sets the date and time when the entity was created.
	/// Automatically set to the current UTC time when a new record is created.
	/// Used for audit tracking and data analysis.
	/// </summary>
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	/// <summary>
	/// Gets or sets the date and time when the entity was last modified.
	/// Automatically updated to the current UTC time whenever the record is changed.
	/// Used for conflict resolution during server synchronization.
	/// </summary>
	public DateTime LastModified { get; set; } = DateTime.UtcNow;

	/// <summary>
	/// Gets or sets the user ID who owns this entity.
	/// Used for multi-tenant data isolation - each user can only access their own records.
	/// Null for local-only records before user authentication is implemented.
	/// </summary>
	[MaxLength(450)]
	public string? UserId { get; set; }

	/// <summary>
	/// Gets or sets the server-side identifier after synchronization.
	/// Null if the record has not been synced to the remote server yet.
	/// Used to map local records to their corresponding server records.
	/// </summary>
	public int? ServerId { get; set; }

	/// <summary>
	/// Gets or sets whether this record needs to be synchronized to the server.
	/// Automatically set to true when the record is created or modified.
	/// Set to false after successful synchronization.
	/// </summary>
	public bool NeedsSync { get; set; } = true;

	/// <summary>
	/// Gets or sets whether this record has been soft-deleted.
	/// Soft-deleted records are hidden from normal queries but retained in the database.
	/// Enables data recovery and proper synchronization with the server.
	/// </summary>
	public bool IsDeleted { get; set; } = false;
}
