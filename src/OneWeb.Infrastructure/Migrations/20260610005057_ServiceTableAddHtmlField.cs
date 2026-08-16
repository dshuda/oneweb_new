using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OneWeb.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ServiceTableAddHtmlField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "detail",
                table: "services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "faq",
                table: "services",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "detail",
                table: "services");

            migrationBuilder.DropColumn(
                name: "faq",
                table: "services");
        }
    }
}
