using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApplicationTracker.Models.Entity;

/// <summary>
/// Base class for all database entities.
/// Provides common properties for tracking, synchronization, and multi-tenant support.
/// Designed for dual compatibility with SQLite-NET and Entity Framework Core.
/// </summary>
public abstract class BaseEntity {
    /// <summary>
    /// Gets or sets the unique identifier for the entity.
    /// Auto-incremented by the database (SQLite).
    /// </summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the entity was created.
    /// Automatically set to the current UTC time when a new record is created.
    /// Used for audit tracking and data analysis.
    /// </summary>
    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the date and time when the entity was last modified.
    /// Automatically updated to the current UTC time whenever the record is changed.
    /// Used for conflict resolution during server synchronization.
    /// </summary>
    [Column("LastModified")]
    public DateTime LastModified { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the user ID who owns this entity.
    /// Used for multi-tenant data isolation - each user can only access their own records.
    /// Null for local-only records before user authentication is implemented.
    /// Standard ASP.NET Identity user ID format (max 450 characters).
    /// </summary>
    [MaxLength(450)]
    [Column("UserId")]
    public string? UserId { get; set; }

    /// <summary>
    /// Gets or sets the server-side identifier after synchronization.
    /// Null if the record has not been synced to the remote server yet.
    /// Used to map local records to their corresponding server records.
    /// </summary>
    [Column("ServerId")]
    public int? ServerId { get; set; }

    /// <summary>
    /// Gets or sets whether this record needs to be synchronized to the server.
    /// Automatically set to true when the record is created or modified.
    /// Set to false after successful synchronization.
    /// Used by the sync service to identify pending changes.
    /// </summary>
    [Column("NeedsSync")]
    public bool NeedsSync { get; set; } = true;

    /// <summary>
    /// Gets or sets whether this record has been soft-deleted.
    /// Soft-deleted records are hidden from normal queries but retained in the database.
    /// Enables data recovery and proper synchronization with the server.
    /// Use instead of hard deletes to maintain referential integrity and sync history.
    /// </summary>
    [Column("IsDeleted")]
    public bool IsDeleted { get; set; } = false;
}
