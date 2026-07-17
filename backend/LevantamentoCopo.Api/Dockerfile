# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia o arquivo .csproj e restaura as dependências
COPY ["backend/LevantamentoCopo.Api/LevantamentoCopo.Api.csproj", "backend/LevantamentoCopo.Api/"]
RUN dotnet restore "backend/LevantamentoCopo.Api/LevantamentoCopo.Api.csproj"

# Copia todo o código da solução para o contêiner
COPY . .
WORKDIR "/src/backend/LevantamentoCopo.Api"
RUN dotnet build "LevantamentoCopo.Api.csproj" -c Release -o /app/build

# Estágio de Publicação
FROM build AS publish
RUN dotnet publish "LevantamentoCopo.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio Final (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# O Render expõe a aplicação em uma porta dinâmica por meio da variável PORT.
# Configuramos o ASP.NET para escutar na porta definida pelo Render (ou 10000 por padrão).
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "LevantamentoCopo.Api.dll"]
