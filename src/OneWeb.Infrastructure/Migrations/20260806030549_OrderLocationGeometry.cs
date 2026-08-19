using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace OneWeb.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class OrderLocationGeometry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.AddColumn<Point>(
                name: "location",
                table: "orders",
                type: "geometry(Point,4326)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "location_name",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_location",
                table: "orders",
                column: "location")
                .Annotation("Npgsql:IndexMethod", "gist");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_orders_location",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "location",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "location_name",
                table: "orders");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:postgis", ",,");
        }
    }
}
