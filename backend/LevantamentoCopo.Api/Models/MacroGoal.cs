using System;

namespace LevantamentoCopo.Api.Models
{
    public class MacroGoal
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public int ProteinTarget { get; set; }
        public int CarbsTarget { get; set; }
        public int FatTarget { get; set; }
        public int CaloriesTarget { get; set; }
        public DateOnly StartDate { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Propriedade de navegação
        public User? User { get; set; }
    }
}
