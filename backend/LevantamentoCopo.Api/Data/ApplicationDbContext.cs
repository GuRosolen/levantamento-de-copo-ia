using Microsoft.EntityFrameworkCore;
using LevantamentoCopo.Api.Models;

namespace LevantamentoCopo.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<MacroGoal> MacroGoals => Set<MacroGoal>();
        public DbSet<MacroLog> MacroLogs => Set<MacroLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamento e nomes de tabelas snake_case (padrão PostgreSQL)
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Email).HasColumnName("email");
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");

                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<MacroGoal>(entity =>
            {
                entity.ToTable("macro_goals");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ProteinTarget).HasColumnName("protein_target");
                entity.Property(e => e.CarbsTarget).HasColumnName("carbs_target");
                entity.Property(e => e.FatTarget).HasColumnName("fat_target");
                entity.Property(e => e.CaloriesTarget).HasColumnName("calories_target");
                entity.Property(e => e.StartDate).HasColumnName("start_date");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");

                entity.HasIndex(e => new { e.UserId, e.StartDate }).IsUnique();
            });

            modelBuilder.Entity<MacroLog>(entity =>
            {
                entity.ToTable("macro_logs");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Protein).HasColumnName("protein");
                entity.Property(e => e.Carbs).HasColumnName("carbs");
                entity.Property(e => e.Fat).HasColumnName("fat");
                entity.Property(e => e.Calories).HasColumnName("calories");
                entity.Property(e => e.LogType).HasColumnName("log_type");
                entity.Property(e => e.ConsumptionDate).HasColumnName("consumption_date");
                entity.Property(e => e.LoggedAt).HasColumnName("logged_at");

                entity.HasIndex(e => new { e.UserId, e.ConsumptionDate });
            });
        }
    }
}
