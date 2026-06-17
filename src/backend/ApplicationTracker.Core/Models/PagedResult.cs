namespace ApplicationTracker.Core.Models;

/// <summary>
/// Wraps a page of results with total count metadata for pagination.
/// </summary>
public class PagedResult<T> {
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}
