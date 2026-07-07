using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApplicationTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDeadBaseEntityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NeedsSync",
                table: "ApplicationRecords");

            migrationBuilder.DropColumn(
                name: "ServerId",
                table: "ApplicationRecords");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NeedsSync",
                table: "ApplicationRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ServerId",
                table: "ApplicationRecords",
                type: "int",
                nullable: true);
        }
    }
}
