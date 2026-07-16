using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace LevantamentoCopo.Api.Controllers
{
    [ApiController]
    [Route("api/v1/ai")]
    public class AiController : ControllerBase
    {
        private static readonly HttpClient _staticHttpClient = new HttpClient(new HttpClientHandler
        {
            UseProxy = false,
            Proxy = null
        })
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        private readonly IConfiguration _configuration;

        public AiController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class EstimateRequest
        {
            public string Description { get; set; } = string.Empty;
        }

        public class EstimateResponse
        {
            public string Description { get; set; } = string.Empty;
            public int Protein { get; set; }
            public int Carbs { get; set; }
            public int Fat { get; set; }
            public int Calories { get; set; }
            public string LogType { get; set; } = "standard";
            public string ProviderUsed { get; set; } = "Simulação Local";
        }

        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            var geminiKey = _configuration["AiSettings:GeminiApiKey"];
            return Ok(new { geminiApiKey = geminiKey });
        }

        [HttpPost("estimate-macros")]
        public async Task<IActionResult> EstimateMacros([FromBody] EstimateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new { message = "A descrição da refeição não pode estar vazia." });
            }

            var geminiKey = _configuration["AiSettings:GeminiApiKey"];

            if (!string.IsNullOrWhiteSpace(geminiKey))
            {
                // 1. Tenta Gemini 3.5 Flash (Versão mais recente)
                try
                {
                    var result = await CallGeminiAsync(request.Description, "gemini-3.5-flash", geminiKey);
                    if (result != null)
                    {
                        result.ProviderUsed = "Gemini 3.5 Flash";
                        return Ok(result);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro ao chamar Gemini 3.5 Flash: {ex.Message}. Tentando modelo mais leve...");
                }

                // 2. Tenta Gemini 3.1 Flash Lite (Versão mais leve para evitar gargalos)
                try
                {
                    var result = await CallGeminiAsync(request.Description, "gemini-3.1-flash-lite", geminiKey);
                    if (result != null)
                    {
                        result.ProviderUsed = "Gemini 3.1 Flash Lite";
                        return Ok(result);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro ao chamar Gemini 3.1 Flash Lite: {ex.Message}. Tentando fallback local...");
                }
            }

            // 3. Fallback Heurístico Local (Simulação de Alta Disponibilidade)
            var fallbackResult = RunLocalHeuristics(request.Description);
            return Ok(fallbackResult);
        }

        private async Task<EstimateResponse?> CallGeminiAsync(string description, string modelName, string apiKey)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";
            
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"Você é um assistente de nutrição especialista. Estime os macronutrientes (proteína, carboidrato, gordura em gramas) e calorias para a seguinte refeição: '{description}'. Retorne um objeto JSON contendo: 'description' (string descritiva curta em português), 'protein' (int), 'carbs' (int), 'fat' (int), 'calories' (int). Se a refeição for predominantemente bebida alcoólica (cerveja, chopp, vinho, gin, etc.), atribua a propriedade 'logType' como 'alcohol', caso contrário use 'standard' ou 'snack'." }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            };
            requestMessage.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            var response = await _staticHttpClient.SendAsync(requestMessage);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini ({modelName}) HTTP Error: {response.StatusCode} - {errorMsg}");
            }

            var responseJsonStr = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(responseJsonStr);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(text)) return null;

            var result = JsonSerializer.Deserialize<EstimateResponse>(text, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result;
        }

        private EstimateResponse RunLocalHeuristics(string description)
        {
            var cleanDesc = description.ToLower();

            int protein = 0;
            int carbs = 0;
            int fat = 0;
            int calories = 0;
            string logType = "standard";

            // Tenta achar gramas na descrição (ex: 200g, 150 g)
            var gramRegex = new Regex(@"(\d+)\s*g");
            var matches = gramRegex.Matches(cleanDesc);
            
            // Heurística básica de busca de termos
            bool foundFood = false;

            if (cleanDesc.Contains("arroz"))
            {
                int weight = GetWeight(cleanDesc, "arroz", 150);
                carbs += (int)(weight * 0.28);
                protein += (int)(weight * 0.02);
                foundFood = true;
            }
            if (cleanDesc.Contains("feijao") || cleanDesc.Contains("feijão"))
            {
                int weight = GetWeight(cleanDesc, "feijao", 100);
                weight = GetWeight(cleanDesc, "feijão", weight);
                carbs += (int)(weight * 0.14);
                protein += (int)(weight * 0.05);
                foundFood = true;
            }
            if (cleanDesc.Contains("frango") || cleanDesc.Contains("peito"))
            {
                int weight = GetWeight(cleanDesc, "frango", 100);
                weight = GetWeight(cleanDesc, "peito", weight);
                protein += (int)(weight * 0.31);
                fat += (int)(weight * 0.03);
                foundFood = true;
            }
            if (cleanDesc.Contains("carne") || cleanDesc.Contains("alcatra") || cleanDesc.Contains("patinho"))
            {
                int weight = GetWeight(cleanDesc, "carne", 100);
                protein += (int)(weight * 0.26);
                fat += (int)(weight * 0.08);
                foundFood = true;
            }
            if (cleanDesc.Contains("ovo"))
            {
                // Conta quantidade de ovos
                int qty = GetQuantity(cleanDesc, "ovo", 2);
                protein += qty * 6;
                fat += qty * 5;
                foundFood = true;
            }
            if (cleanDesc.Contains("chopp") || cleanDesc.Contains("cerveja") || cleanDesc.Contains("copo") || 
                cleanDesc.Contains("vinho") || cleanDesc.Contains("gin") || cleanDesc.Contains("heineken") || 
                cleanDesc.Contains("lata") || cleanDesc.Contains("latas") || cleanDesc.Contains("garrafa") || 
                cleanDesc.Contains("garrafas") || cleanDesc.Contains("cervejas"))
            {
                logType = "alcohol";
                int qty = 1;
                
                var qtyMatch = Regex.Match(cleanDesc, @"(\d+)\s*(?:x|unidade|unidades|lata|latas|copo|copos|garrafa|garrafas|dose|doses|cerveja|cervejas|chopp|heineken)");
                if (qtyMatch.Success && int.TryParse(qtyMatch.Groups[1].Value, out int parsedQty))
                {
                    qty = parsedQty;
                }
                
                carbs += qty * 12;
                calories += qty * 150;
                foundFood = true;
            }

            if (!foundFood)
            {
                // Refeição padrão default se não detectado nada específico
                protein = 25;
                carbs = 35;
                fat = 8;
                logType = "standard";
            }

            if (logType != "alcohol")
            {
                calories = (protein * 4) + (carbs * 4) + (fat * 9);
            }

            // Limita a descrição para exibição curta
            string displayDesc = description.Length > 40 ? description.Substring(0, 37) + "..." : description;

            return new EstimateResponse
            {
                Description = displayDesc,
                Protein = protein,
                Carbs = carbs,
                Fat = fat,
                Calories = calories,
                LogType = logType,
                ProviderUsed = "Simulação Local (Fallback)"
            };
        }

        private int GetWeight(string text, string foodKey, int defaultWeight)
        {
            // Procura números antes ou depois do nome do alimento contendo 'g'
            var regexPattern = $@"(?:\d+\s*g\s+de\s+{foodKey})|({foodKey}\s+de\s+\d+\s*g)|(\d+\s*g\s+{foodKey})|({foodKey}\s+\d+\s*g)";
            var match = Regex.Match(text, regexPattern);
            if (match.Success)
            {
                var numMatch = Regex.Match(match.Value, @"\d+");
                if (numMatch.Success && int.TryParse(numMatch.Value, out int w))
                {
                    return w;
                }
            }
            return defaultWeight;
        }

        private int GetQuantity(string text, string foodKey, int defaultQty)
        {
            var regexPattern = $@"(?:\d+\s+{foodKey})|({foodKey}\s+\d+)";
            var match = Regex.Match(text, regexPattern);
            if (match.Success)
            {
                var numMatch = Regex.Match(match.Value, @"\d+");
                if (numMatch.Success && int.TryParse(numMatch.Value, out int q))
                {
                    return q;
                }
            }
            return defaultQty;
        }
    }
}
