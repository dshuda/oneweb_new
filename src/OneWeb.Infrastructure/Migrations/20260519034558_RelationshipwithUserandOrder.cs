using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OneWeb.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RelationshipwithUserandOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_orders_users_user_id1",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "ix_orders_user_id1",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "user_id1",
                table: "orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "user_id1",
                table: "orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_user_id1",
                table: "orders",
                column: "user_id1");

            migrationBuilder.AddForeignKey(
                name: "fk_orders_users_user_id1",
                table: "orders",
                column: "user_id1",
                principalTable: "users",
                principalColumn: "id");
        }
    }
}
