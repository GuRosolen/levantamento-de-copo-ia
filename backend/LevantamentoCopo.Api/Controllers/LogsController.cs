using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LevantamentoCopo.Api.Data;
using LevantamentoCopo.Api.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace LevantamentoCopo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1")]
    public class LogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/v1/macro-logs
        [HttpPost("macro-logs")]
        public async Task<IActionResult> CreateLog([FromBody] MacroLog log)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authenticatedUserId))
            {
                return Unauthorized();
            }

            log.UserId = Guid.Parse(authenticatedUserId);
            log.Id = Guid.NewGuid();
            log.LoggedAt = DateTimeOffset.UtcNow;

            _context.MacroLogs.Add(log);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLog), new { id = log.Id }, log);
        }

        // GET: api/v1/macro-logs/{id}
        [HttpGet("macro-logs/{id}")]
        public async Task<IActionResult> GetLog(Guid id)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var log = await _context.MacroLogs.FindAsync(id);
            if (log == null) return NotFound();
            
            if (log.UserId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            return Ok(log);
        }

        // PUT: api/v1/macro-logs/{id}
        [HttpPut("macro-logs/{id}")]
        public async Task<IActionResult> UpdateLog(Guid id, [FromBody] MacroLog updatedLog)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var log = await _context.MacroLogs.FindAsync(id);
            if (log == null) return NotFound();

            if (log.UserId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            log.Description = updatedLog.Description;
            log.Protein = updatedLog.Protein;
            log.Carbs = updatedLog.Carbs;
            log.Fat = updatedLog.Fat;
            log.Calories = updatedLog.Calories;
            log.LogType = updatedLog.LogType;
            log.ConsumptionDate = updatedLog.ConsumptionDate;

            await _context.SaveChangesAsync();
            return Ok(log);
        }

        // DELETE: api/v1/macro-logs/{id}
        [HttpDelete("macro-logs/{id}")]
        public async Task<IActionResult> DeleteLog(Guid id)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var log = await _context.MacroLogs.FindAsync(id);
            if (log == null) return NotFound();

            if (log.UserId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            _context.MacroLogs.Remove(log);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/v1/users/{userId}/daily-summary
        [HttpGet("users/{userId}/daily-summary")]
        public async Task<IActionResult> GetDailySummary(Guid userId, [FromQuery] string? date)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId != userId.ToString())
            {
                return Forbid();
            }

            if (!DateOnly.TryParse(date, out var queryDate))
            {
                queryDate = DateOnly.FromDateTime(DateTime.Today);
            }

            // 1. Busca a meta para o dia
            var goal = await _context.MacroGoals
                .Where(g => g.UserId == userId && g.StartDate <= queryDate)
                .OrderByDescending(g => g.StartDate)
                .FirstOrDefaultAsync();

            var goalDto = goal ?? new MacroGoal
            {
                UserId = userId,
                ProteinTarget = 150,
                CarbsTarget = 200,
                FatTarget = 65,
                CaloriesTarget = 1985,
                StartDate = queryDate
            };

            // 2. Busca os logs do dia
            var logs = await _context.MacroLogs
                .Where(l => l.UserId == userId && l.ConsumptionDate == queryDate)
                .ToListAsync();

            // 3. Consolida os totais por tipo
            var totals = new
            {
                Protein = logs.Sum(l => l.Protein),
                Carbs = logs.Sum(l => l.Carbs),
                Fat = logs.Sum(l => l.Fat),
                Calories = logs.Sum(l => l.Calories)
            };

            var totalsByType = logs
                .GroupBy(l => l.LogType)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        Protein = g.Sum(l => l.Protein),
                        Carbs = g.Sum(l => l.Carbs),
                        Fat = g.Sum(l => l.Fat),
                        Calories = g.Sum(l => l.Calories)
                    }
                );

            // Garante que tipos padrão venham preenchidos com zero se vazios
            foreach (var type in new[] { "standard", "snack", "alcohol" })
            {
                if (!totalsByType.ContainsKey(type))
                {
                    totalsByType[type] = new { Protein = 0, Carbs = 0, Fat = 0, Calories = 0 };
                }
            }

            return Ok(new
            {
                Date = queryDate,
                Goals = new
                {
                    Protein = goalDto.ProteinTarget,
                    Carbs = goalDto.CarbsTarget,
                    Fat = goalDto.FatTarget,
                    Calories = goalDto.CaloriesTarget
                },
                Totals = totals,
                TotalsByType = totalsByType,
                Entries = logs
            });
        }
    }
}
