using System;
using System.Collections.Generic;

namespace LevantamentoCopo.Api.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Propriedades de navegação
        public ICollection<MacroGoal> MacroGoals { get; set; } = new List<MacroGoal>();
        public ICollection<MacroLog> MacroLogs { get; set; } = new List<MacroLog>();
    }
}
