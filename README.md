# Levantamento de Copo IA 🍺

Este é o MVP de um SaaS de gerenciamento e cálculo de macros nutricionais diários. Ele foi desenhado para pessoas que mantêm uma alimentação balanceada e rígida durante a semana, mas que precisam de flexibilidade para registrar lanches ou consumo de álcool ("levantamento de copo") nos fins de semana sem quebrar a lógica do sistema.

A aplicação inclui uma tela de autenticação segura via **JWT** e uma aba com estimativas automáticas de macronutrientes alimentadas pela inteligência artificial do **Gemini 3.5 Flash**.

---

## 📁 Estrutura do Projeto

*   **`/db`**: Contém o script SQL do banco de dados PostgreSQL (`schema.sql`).
*   **`/backend`**: API REST desenvolvida em **.NET 10** (`net10.0`) e C#.
*   **`/frontend`**: Aplicação frontend desenvolvida em **React**, **Vite** e **Vanilla CSS**, pré-configurada para deploy direto na **Vercel**.

---

## 🛡️ Segurança e Configurações de Privacidade (Git)

As credenciais do banco e chaves de API de IA foram isoladas em arquivos locais para prevenir vazamentos de dados ao subir o projeto no GitHub.

*   **`.gitignore`**: Configurado na raiz para ignorar metadados de IDEs, compilações (`bin/`, `obj/`), dependências de pacotes (`node_modules/`), e configurações locais com senhas e chaves.
*   **`appsettings.json`**: Contém apenas placeholders genéricos seguros e deve ser enviado para o repositório.
*   **`appsettings.Development.json`**: Contém as suas chaves reais do Gemini, OpenAI e banco local. **Este arquivo está na lista de ignore e nunca será enviado ao GitHub.**

---

## 🚀 Como Executar

### Pré-requisitos
*   .NET 10 SDK (Runtime AspNetCore 10.0+)
*   Node.js (v18+)
*   PostgreSQL

### 1. Banco de Dados
Execute o script em [schema.sql](file:///C:/Users/groso/Documents/Projetos/levantamento-de-copo-ia/db/schema.sql) na sua instância local do PostgreSQL.

### 2. Backend
1. Navegue até a pasta `backend/LevantamentoCopo.Api/`.
2. Para alterar as credenciais locais do banco, chaves do Gemini ou JWT, configure-as no seu arquivo local **`appsettings.Development.json`**.
3. Execute no terminal:
   ```bash
   dotnet run
   ```

### 3. Frontend
1. Navegue até a pasta `frontend/`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## ☁️ Hospedagem na Nuvem (Vercel)

O frontend possui o arquivo `vercel.json` configurado para reescrever rotas SPA de forma transparente na Vercel. 

1. Conecte o seu repositório no painel da Vercel.
2. Defina a pasta do projeto como `frontend/`.
3. Adicione a variável de ambiente `VITE_API_URL` com o endereço do seu backend hospedado na nuvem.
