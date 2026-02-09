using ApplicationTracker.Core.Entities;
using ApplicationTracker.Core.Interfaces.Repositories;
using ApplicationTracker.Infrastructure.Data;

namespace ApplicationTracker.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for application record operations.
/// </summary>
public class ApplicationRecordRepository(ApplicationDbContext context) : Repository<ApplicationRecord>(context),
	IApplicationRecordRepository;
