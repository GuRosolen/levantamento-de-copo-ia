using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LevantamentoCopo.Api.Data;
using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace LevantamentoCopo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/users/{userId}/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardSummary(
            Guid userId,
            [FromQuery] string period,
            [FromQuery] string startDate,
            [FromQuery] string endDate)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId != userId.ToString())
            {
                return Forbid();
            }

            if (!DateOnly.TryParse(startDate, out var start) || !DateOnly.TryParse(endDate, out var end))
            {
                return BadRequest(new { message = "Datas inicial ou final inválidas. Use o formato YYYY-MM-DD." });
            }

            var logs = await _context.MacroLogs
                .Where(l => l.UserId == userId && l.ConsumptionDate >= start && l.ConsumptionDate <= end)
                .ToListAsync();

            if (period.ToLower() == "week")
            {
                var grouped = logs
                    .GroupBy(l => GetStartOfWeek(l.ConsumptionDate))
                    .Select(g => new
                    {
                        PeriodStart = g.Key,
                        PeriodEnd = g.Key.AddDays(6),
                        Totals = new
                        {
                            Protein = g.Sum(l => l.Protein),
                            Carbs = g.Sum(l => l.Carbs),
                            Fat = g.Sum(l => l.Fat),
                            Calories = g.Sum(l => l.Calories)
                        },
                        Deviations = new
                        {
                            AlcoholCalories = g.Where(l => l.LogType == "alcohol").Sum(l => l.Calories),
                            SnackCalories = g.Where(l => l.LogType == "snack").Sum(l => l.Calories)
                        }
                    })
                    .OrderBy(g => g.PeriodStart)
                    .ToList();

                return Ok(grouped);
            }
            else if (period.ToLower() == "month")
            {
                var grouped = logs
                    .GroupBy(l => new DateOnly(l.ConsumptionDate.Year, l.ConsumptionDate.Month, 1))
                    .Select(g => new
                    {
                        PeriodStart = g.Key,
                        PeriodEnd = g.Key.AddMonths(1).AddDays(-1),
                        Totals = new
                        {
                            Protein = g.Sum(l => l.Protein),
                            Carbs = g.Sum(l => l.Carbs),
                            Fat = g.Sum(l => l.Fat),
                            Calories = g.Sum(l => l.Calories)
                        },
                        Deviations = new
                        {
                            AlcoholCalories = g.Where(l => l.LogType == "alcohol").Sum(l => l.Calories),
                            SnackCalories = g.Where(l => l.LogType == "snack").Sum(l => l.Calories)
                        }
                    })
                    .OrderBy(g => g.PeriodStart)
                    .ToList();

                return Ok(grouped);
            }

            return BadRequest(new { message = "Período inválido. Use 'week' ou 'month'." });
        }

        private static DateOnly GetStartOfWeek(DateOnly date)
        {
            // Retorna a segunda-feira da semana correspondente
            int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-diff);
        }
    }
}
