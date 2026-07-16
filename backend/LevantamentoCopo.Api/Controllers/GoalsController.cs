using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LevantamentoCopo.Api.Data;
using LevantamentoCopo.Api.Models;
using System;
using System.Threading.Tasks;

namespace LevantamentoCopo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/users/{userId}/goals")]
    public class GoalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GoalsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/v1/users/{userId}/goals
        [HttpPost]
        public async Task<IActionResult> CreateGoal(Guid userId, [FromBody] MacroGoal goalDto)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId != userId.ToString())
            {
                return Forbid();
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return NotFound(new { message = "Usuário não encontrado." });
            }

            goalDto.UserId = userId;
            goalDto.Id = Guid.NewGuid();
            goalDto.CreatedAt = DateTimeOffset.UtcNow;

            // Tratamento de conflito de datas únicas por usuário
            var existingGoal = await _context.MacroGoals
                .FirstOrDefaultAsync(g => g.UserId == userId && g.StartDate == goalDto.StartDate);

            if (existingGoal != null)
            {
                existingGoal.ProteinTarget = goalDto.ProteinTarget;
                existingGoal.CarbsTarget = goalDto.CarbsTarget;
                existingGoal.FatTarget = goalDto.FatTarget;
                existingGoal.CaloriesTarget = goalDto.CaloriesTarget;
                _context.MacroGoals.Update(existingGoal);
            }
            else
            {
                _context.MacroGoals.Add(goalDto);
            }

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetActiveGoal), new { userId = userId, date = goalDto.StartDate.ToString("yyyy-MM-dd") }, goalDto);
        }

        // GET: api/v1/users/{userId}/goals/active
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveGoal(Guid userId, [FromQuery] string? date)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId != userId.ToString())
            {
                return Forbid();
            }

            if (!DateOnly.TryParse(date, out var targetDate))
            {
                targetDate = DateOnly.FromDateTime(DateTime.Today);
            }

            var goal = await _context.MacroGoals
                .Where(g => g.UserId == userId && g.StartDate <= targetDate)
                .OrderByDescending(g => g.StartDate)
                .FirstOrDefaultAsync();

            if (goal == null)
            {
                // Retorna uma meta default caso não exista uma cadastrada
                return Ok(new MacroGoal
                {
                    UserId = userId,
                    ProteinTarget = 150,
                    CarbsTarget = 200,
                    FatTarget = 65,
                    CaloriesTarget = 1985,
                    StartDate = targetDate
                });
            }

            return Ok(goal);
        }
    }
}
