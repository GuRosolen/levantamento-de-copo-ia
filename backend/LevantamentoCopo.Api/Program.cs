using Microsoft.EntityFrameworkCore;
using LevantamentoCopo.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpClient("", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    UseProxy = false
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SuperSecretKeyForLevantamentoDeCopoIa2026TokenSigningKey!!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "LevantamentoCopo.Api",
        ValidAudience = jwtSettings["Audience"] ?? "LevantamentoCopo.Ui",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrEmpty(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
{
    var databaseUri = new Uri(connectionString);
    var colonIndex = databaseUri.UserInfo.IndexOf(':');
    var username = colonIndex >= 0 ? databaseUri.UserInfo.Substring(0, colonIndex) : databaseUri.UserInfo;
    var password = colonIndex >= 0 ? databaseUri.UserInfo.Substring(colonIndex + 1) : "";
    
    // Decodifica caracteres especiais como %40 (@), %3A (:), %3D (=) etc
    username = Uri.UnescapeDataString(username);
    password = Uri.UnescapeDataString(password);
    
    var host = databaseUri.Host;
    var port = databaseUri.Port > 0 ? databaseUri.Port : 5432;
    var database = databaseUri.AbsolutePath.TrimStart('/');
    
    // Envolvemos a senha em aspas duplas caso ela contenha ponto e vírgula ou outros delimitadores
    connectionString = $"Host={host};Port={port};Database={database};Username={username};Password=\"{password}\";SSL Mode=Require;Trust Server Certificate=true";
}

// Imprime a string de conexão mascarada para debug seguro no Render
if (!string.IsNullOrEmpty(connectionString))
{
    var parts = connectionString.Split(';');
    for (int i = 0; i < parts.Length; i++)
    {
        if (parts[i].StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
            parts[i] = "Password=********";
    }
    Console.WriteLine($"[Database Debug] Connection String: {string.Join(";", parts)}");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure CORS for frontend access
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Executa migrações automáticas de DDL de forma resiliente no banco
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync();
        await context.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ");
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
        ");
        Console.WriteLine("Migrações de banco de dados executadas com sucesso.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao executar migrações de banco de dados: {ex.Message}");
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Endpoint de healthcheck inicial
app.MapGet("/", () => Results.Ok(new { message = "Levantamento de Copo API rodando!" }));

app.Run();
