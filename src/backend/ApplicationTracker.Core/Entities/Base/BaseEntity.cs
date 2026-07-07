namespace ApplicationTracker.Core.Entities.Base;

/// <summary>
/// Base class for all domain entities.
/// Provides common properties for tracking and multi-tenant support.
/// </summary>
public abstract class BaseEntity {
    /// <summary>
    /// Gets or sets the unique identifier for the entity.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the entity was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the date and time when the entity was last modified.
    /// </summary>
    public DateTime LastModified { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the user ID who owns this entity.
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Gets or sets whether this record has been soft-deleted.
    /// </summary>
    public bool IsDeleted { get; set; } = false;
}
