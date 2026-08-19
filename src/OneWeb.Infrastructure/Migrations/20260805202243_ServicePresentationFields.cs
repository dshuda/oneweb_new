using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OneWeb.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ServicePresentationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "hero_subtitle",
                table: "services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "hero_title",
                table: "services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "price_unit",
                table: "services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "rating",
                table: "services",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "review_count",
                table: "services",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "hero_subtitle",
                table: "services");

            migrationBuilder.DropColumn(
                name: "hero_title",
                table: "services");

            migrationBuilder.DropColumn(
                name: "price_unit",
                table: "services");

            migrationBuilder.DropColumn(
                name: "rating",
                table: "services");

            migrationBuilder.DropColumn(
                name: "review_count",
                table: "services");
        }
    }
}
