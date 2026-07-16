using System;

namespace LevantamentoCopo.Api.Models
{
    public class MacroLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Protein { get; set; }
        public int Carbs { get; set; }
        public int Fat { get; set; }
        public int Calories { get; set; }
        public string LogType { get; set; } = "standard"; // standard, snack, alcohol, cheat
        public DateOnly ConsumptionDate { get; set; }
        public DateTimeOffset LoggedAt { get; set; } = DateTimeOffset.UtcNow;

        // Propriedade de navegação
        public User? User { get; set; }
    }
}
