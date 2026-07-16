import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Activity, 
  Calendar, 
  PieChart, 
  TrendingUp, 
  Beer,
  Apple,
  Settings,
  AlertTriangle
} from 'lucide-react';
import * as apiService from './services/api';

export default function App() {
  // Sessão de Autenticação JWT
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  // States do formulário de autenticação
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'dashboard'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const handleStartDemo = () => {
    const demoUser = { userId: 'e82b781b-5e3e-4b47-9dc4-8395cfd71317', name: 'Demo Offline', email: 'demo@copo.ia' };
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('token', 'offline-demo-token');
    setUser(demoUser);
    setToken('offline-demo-token');
    setBackendOnline(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authTab === 'login') {
        const data = await apiService.login(authForm.email, authForm.password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ userId: data.userId, name: data.name, email: data.email }));
        setUser({ userId: data.userId, name: data.name, email: data.email });
        setToken(data.token);
      } else {
        const data = await apiService.register(authForm.name, authForm.email, authForm.password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ userId: data.userId, name: data.name, email: data.email }));
        setUser({ userId: data.userId, name: data.name, email: data.email });
        setToken(data.token);
      }
    } catch (err) {
      console.error("Erro na autenticação:", err);
      const msg = err.response?.data?.message || "Erro ao conectar com o servidor. Verifique se o backend está ligado.";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };
  
  // States para Tela 1 (Diário)
  const [dailyData, setDailyData] = useState({
    date: selectedDate,
    goals: { protein: 150, carbs: 200, fat: 65, calories: 1985 },
    totals: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    totalsByType: {
      standard: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      snack: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      alcohol: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    },
    entries: []
  });

  // State de Edição de Metas
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    proteinTarget: 150,
    carbsTarget: 200,
    fatTarget: 65,
    caloriesTarget: 1985
  });

  // State de Novo Log
  const [newLog, setNewLog] = useState({
    description: '',
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
    logType: 'standard'
  });

  // States para Tela 2 (Dashboard)
  const [dashPeriod, setDashPeriod] = useState('week'); // 'week' or 'month'
  const [dashData, setDashData] = useState([]);
  
  // Controle de conexão com a API backend
  const [backendOnline, setBackendOnline] = useState(false);

  // States para Estimativa por IA
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'ai'
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('');
  const [aiError, setAiError] = useState('');

  const simulateLocalAI = (text) => {
    const cleanDesc = text.toLowerCase();
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let calories = 0;
    let logType = "standard";

    const getWeight = (t, foodKey, def) => {
      const regexPattern = new RegExp(`(?:\\d+\\s*g\\s+de\\s+${foodKey})|(${foodKey}\\s+de\\s+\\d+\\s*g)|(\\d+\\s*g\\s+${foodKey})|(${foodKey}\\s+\\d+\\s*g)`);
      const match = t.match(regexPattern);
      if (match) {
        const numMatch = match[0].match(/\\d+/);
        if (numMatch) return parseInt(numMatch[0]);
      }
      return def;
    };

    const getQuantity = (t, foodKey, def) => {
      const regexPattern = new RegExp(`(?:\\d+\\s+${foodKey})|(${foodKey}\\s+\\d+)`);
      const match = t.match(regexPattern);
      if (match) {
        const numMatch = match[0].match(/\\d+/);
        if (numMatch) return parseInt(numMatch[0]);
      }
      return def;
    };

    let found = false;

    if (cleanDesc.includes("arroz")) {
      const w = getWeight(cleanDesc, "arroz", 150);
      carbs += Math.round(w * 0.28);
      protein += Math.round(w * 0.02);
      found = true;
    }
    if (cleanDesc.includes("feijao") || cleanDesc.includes("feijão")) {
      const w = getWeight(cleanDesc, "feijao", 100);
      carbs += Math.round(w * 0.14);
      protein += Math.round(w * 0.05);
      found = true;
    }
    if (cleanDesc.includes("frango") || cleanDesc.includes("peito")) {
      const w = getWeight(cleanDesc, "frango", 100);
      protein += Math.round(w * 0.31);
      fat += Math.round(w * 0.03);
      found = true;
    }
    if (cleanDesc.includes("carne") || cleanDesc.includes("alcatra") || cleanDesc.includes("patinho")) {
      const w = getWeight(cleanDesc, "carne", 100);
      protein += Math.round(w * 0.26);
      fat += Math.round(w * 0.08);
      found = true;
    }
    if (cleanDesc.includes("ovo")) {
      const q = getQuantity(cleanDesc, "ovo", 2);
      protein += q * 6;
      fat += q * 5;
      found = true;
    }
    if (
      cleanDesc.includes("chopp") || 
      cleanDesc.includes("cerveja") || 
      cleanDesc.includes("copo") || 
      cleanDesc.includes("vinho") || 
      cleanDesc.includes("gin") ||
      cleanDesc.includes("heineken") ||
      cleanDesc.includes("lata") ||
      cleanDesc.includes("latas") ||
      cleanDesc.includes("garrafa") ||
      cleanDesc.includes("garrafas") ||
      cleanDesc.includes("cervejas")
    ) {
      logType = "alcohol";
      let q = 1;
      const qtyMatch = cleanDesc.match(/(\d+)\s*(?:x|unidade|unidades|lata|latas|copo|copos|garrafa|garrafas|dose|doses|cerveja|cervejas|chopp|heineken)/);
      if (qtyMatch) {
        q = parseInt(qtyMatch[1]);
      }
      carbs += q * 12;
      calories += q * 150;
      found = true;
    }

    if (!found) {
      protein = 25;
      carbs = 35;
      fat = 8;
    }

    if (logType !== "alcohol") {
      calories = (protein * 4) + (carbs * 4) + (fat * 9);
    }

    const shortDesc = text.length > 40 ? text.substring(0, 37) + '...' : text;

    return {
      description: shortDesc,
      protein,
      carbs,
      fat,
      calories,
      logType,
      providerUsed: "Simulação Local (Offline)"
    };
  };

  const callGeminiDirectly = async (description, modelName, apiKey) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Você é um assistente de nutrição especialista. Estime os macronutrientes (proteína, carboidrato, gordura em gramas) e calorias para a seguinte refeição: '${description}'. Retorne um objeto JSON contendo: 'description' (string descritiva curta em português), 'protein' (int), 'carbs' (int), 'fat' (int), 'calories' (int). Se a refeição for predominantemente bebida alcoólica (cerveja, chopp, vinho, gin, etc.), atribua a propriedade 'logType' como 'alcohol', caso contrário use 'standard' ou 'snack'.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Gemini Direct (${modelName}) HTTP Error: ${response.status} - ${errorMsg}`);
    }

    const resJson = await response.json();
    const text = resJson.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  };

  const handleEstimateAI = async (e) => {
    e.preventDefault();
    if (!aiText.trim()) return;

    setAiLoading(true);
    setAiError('');
    setAiProvider('');

    try {
      // 1. Obtém a chave de API cadastrada no appsettings.json do backend
      let apiKey = null;
      try {
        const config = await apiService.getAiConfig();
        apiKey = config.geminiApiKey;
      } catch (configErr) {
        console.warn("Não foi possível carregar a configuração de IA do backend.", configErr);
      }

      if (!apiKey) {
        throw new Error("Chave do Gemini não configurada no backend.");
      }

      let data = null;
      
      // 2. Tenta fazer a requisição direta do navegador para o Gemini 3.5 Flash
      try {
        data = await callGeminiDirectly(aiText, "gemini-3.5-flash", apiKey);
        setAiProvider("Gemini 3.5 Flash (Direto)");
      } catch (gemini35Err) {
        console.warn("Erro ao chamar Gemini 3.5 Flash direto. Tentando modelo mais leve...", gemini35Err);
        
        // 3. Fallback para Gemini 3.1 Flash Lite (versão leve para evitar gargalos)
        data = await callGeminiDirectly(aiText, "gemini-3.1-flash-lite", apiKey);
        setAiProvider("Gemini 3.1 Flash Lite (Direto)");
      }

      setNewLog({
        description: data.description,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        calories: data.calories,
        logType: data.logType || 'standard'
      });
      setAiText('');
      setInputMethod('manual'); // Transiciona para que o usuário revise
    } catch (err) {
      console.warn("Falha ao chamar a IA real. Usando simulação local como fallback.", err);
      try {
        const data = simulateLocalAI(aiText);
        setNewLog({
          description: data.description,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          calories: data.calories,
          logType: data.logType || 'standard'
        });
        setAiProvider(data.providerUsed || 'Simulação Local (Offline)');
        setAiText('');
        setInputMethod('manual');
      } catch (fallbackErr) {
        setAiError('Erro ao estimar macros por IA. Tente preenchimento manual.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-cálculo de calorias com base nos macros inseridos (4/4/9 kcal por grama de prot/carb/gord)
  useEffect(() => {
    if (newLog.logType !== 'alcohol') {
      const calcCalories = (newLog.protein * 4) + (newLog.carbs * 4) + (newLog.fat * 9);
      setNewLog(prev => ({ ...prev, calories: calcCalories }));
    }
  }, [newLog.protein, newLog.carbs, newLog.fat, newLog.logType]);

  // Carrega os dados dependendo da aba ativa
  useEffect(() => {
    loadData();
  }, [selectedDate, activeTab, dashPeriod]);

  const loadData = async () => {
    if (!user) return;
    try {
      if (activeTab === 'daily') {
        const data = await apiService.getDailySummary(user.userId, selectedDate);
        setDailyData(data);
        setGoalForm({
          proteinTarget: data.goals.protein,
          carbsTarget: data.goals.carbs,
          fatTarget: data.goals.fat,
          caloriesTarget: data.goals.calories
        });
        setBackendOnline(true);
      } else {
        // Dashboard de 30 dias para semana ou 90 dias para mês
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (dashPeriod === 'week' ? 28 : 90));
        
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        const data = await apiService.getDashboard(user.userId, dashPeriod, startStr, endStr);
        setDashData(data);
        setBackendOnline(true);
      }
    } catch (err) {
      console.warn("Backend offline. Carregando dados locais mockados para demonstração.");
      setBackendOnline(false);
      loadMockData();
    }
  };

  // Lógica de fallback para visualização interativa do MVP se a API estiver offline
  const loadMockData = () => {
    // Busca do LocalStorage ou define padrão mock
    const localLogsKey = `logs_${selectedDate}`;
    const localGoalKey = 'user_goals';
    
    let savedGoal = localStorage.getItem(localGoalKey);
    let goals = savedGoal ? JSON.parse(savedGoal) : { protein: 160, carbs: 200, fat: 70, calories: 2070 };
    
    let savedLogs = localStorage.getItem(localLogsKey);
    let entries = savedLogs ? JSON.parse(savedLogs) : [
      { id: '1', description: 'Café da Manhã Limpo', protein: 30, carbs: 45, fat: 10, calories: 390, logType: 'standard' },
      { id: '2', description: 'Almoço Dieta', protein: 50, carbs: 60, fat: 15, calories: 575, logType: 'standard' }
    ];

    if (!savedLogs && selectedDate.endsWith('0') || selectedDate.endsWith('6') || selectedDate.endsWith('7')) {
      // Adiciona chopp e snacks no fim de semana para simular o modelo
      entries.push({ id: '3', description: 'Chopp e Batata Frita', protein: 8, carbs: 90, fat: 35, calories: 707, logType: 'alcohol' });
      entries.push({ id: '4', description: 'Pastel de Carne', protein: 12, carbs: 40, fat: 22, calories: 406, logType: 'snack' });
    }

    const totals = entries.reduce((acc, log) => {
      acc.protein += log.protein;
      acc.carbs += log.carbs;
      acc.fat += log.fat;
      acc.calories += log.calories;
      return acc;
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

    const totalsByType = entries.reduce((acc, log) => {
      if (acc[log.logType]) {
        acc[log.logType].protein += log.protein;
        acc[log.logType].carbs += log.carbs;
        acc[log.logType].fat += log.fat;
        acc[log.logType].calories += log.calories;
      }
      return acc;
    }, {
      standard: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      snack: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      alcohol: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    });

    if (activeTab === 'daily') {
      setDailyData({ date: selectedDate, goals, totals, totalsByType, entries });
      setGoalForm({
        proteinTarget: goals.protein,
        carbsTarget: goals.carbs,
        fatTarget: goals.fat,
        caloriesTarget: goals.calories
      });
    } else {
      // Mock de Dashboard histórico
      const mockHist = [];
      const now = new Date();
      for (let i = (dashPeriod === 'week' ? 4 : 3); i >= 0; i--) {
        const d = new Date();
        if (dashPeriod === 'week') {
          d.setDate(now.getDate() - (i * 7));
          const startW = new Date(d);
          startW.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          const endW = new Date(startW);
          endW.setDate(startW.getDate() + 6);
          
          mockHist.push({
            period_start: startW.toISOString().split('T')[0],
            period_end: endW.toISOString().split('T')[0],
            totals: {
              protein: 1000 + Math.floor(Math.random() * 200),
              carbs: 1300 + Math.floor(Math.random() * 300),
              fat: 420 + Math.floor(Math.random() * 100),
              calories: 13000 + Math.floor(Math.random() * 3000)
            },
            deviations: {
              alcoholCalories: 1000 + Math.floor(Math.random() * 1500),
              snackCalories: 500 + Math.floor(Math.random() * 800)
            }
          });
        } else {
          d.setMonth(now.getMonth() - i);
          const startM = new Date(d.getFullYear(), d.getMonth(), 1);
          const endM = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          
          mockHist.push({
            period_start: startM.toISOString().split('T')[0],
            period_end: endM.toISOString().split('T')[0],
            totals: {
              protein: 4200 + Math.floor(Math.random() * 800),
              carbs: 5800 + Math.floor(Math.random() * 1200),
              fat: 1800 + Math.floor(Math.random() * 400),
              calories: 56000 + Math.floor(Math.random() * 10000)
            },
            deviations: {
              alcoholCalories: 4500 + Math.floor(Math.random() * 5000),
              snackCalories: 2500 + Math.floor(Math.random() * 3000)
            }
          });
        }
      }
      setDashData(mockHist);
    }
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.description) return;

    const payload = {
      userId: user?.userId,
      description: newLog.description,
      protein: parseInt(newLog.protein) || 0,
      carbs: parseInt(newLog.carbs) || 0,
      fat: parseInt(newLog.fat) || 0,
      calories: parseInt(newLog.calories) || 0,
      logType: newLog.logType,
      consumptionDate: selectedDate
    };

    if (backendOnline) {
      try {
        await apiService.addLog(payload);
        loadData();
      } catch (err) {
        console.error("Erro ao adicionar log no backend:", err);
      }
    } else {
      // Salva no LocalStorage em modo offline
      const localLogsKey = `logs_${selectedDate}`;
      const savedLogs = localStorage.getItem(localLogsKey);
      const list = savedLogs ? JSON.parse(savedLogs) : [];
      list.push({ ...payload, id: Date.now().toString() });
      localStorage.setItem(localLogsKey, JSON.stringify(list));
      loadMockData();
    }

    setNewLog({
      description: '',
      protein: 0,
      carbs: 0,
      fat: 0,
      calories: 0,
      logType: 'standard'
    });
  };

  const handleDeleteLog = async (id) => {
    if (backendOnline) {
      try {
        await apiService.deleteLog(id);
        loadData();
      } catch (err) {
        console.error("Erro ao deletar log no backend:", err);
      }
    } else {
      // Deleta do LocalStorage
      const localLogsKey = `logs_${selectedDate}`;
      const savedLogs = localStorage.getItem(localLogsKey);
      if (savedLogs) {
        const list = JSON.parse(savedLogs).filter(x => x.id !== id);
        localStorage.setItem(localLogsKey, JSON.stringify(list));
        loadMockData();
      }
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const payload = {
      proteinTarget: parseInt(goalForm.proteinTarget),
      carbsTarget: parseInt(goalForm.carbsTarget),
      fatTarget: parseInt(goalForm.fatTarget),
      caloriesTarget: parseInt(goalForm.caloriesTarget),
      startDate: selectedDate
    };

    if (backendOnline && user) {
      try {
        await apiService.updateGoal(user.userId, payload);
        setShowGoalModal(false);
        loadData();
      } catch (err) {
        console.error("Erro ao salvar meta no backend:", err);
      }
    } else {
      localStorage.setItem('user_goals', JSON.stringify({
        protein: payload.proteinTarget,
        carbs: payload.carbsTarget,
        fat: payload.fatTarget,
        calories: payload.caloriesTarget
      }));
      setShowGoalModal(false);
      loadMockData();
    }
  };

  // Helper de Rendering para os anéis de progresso
  const renderProgressRing = (value, target, label, colorVar, unit = 'g') => {
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className="card macro-ring-card" key={label}>
        <div className="ring-outer">
          <svg className="ring-svg">
            <circle className="ring-bg" cx="50" cy="50" r={radius} />
            <circle 
              className="ring-bar" 
              cx="50" 
              cy="50" 
              r={radius} 
              stroke={colorVar}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="ring-text" style={{ color: colorVar }}>
            {pct}%
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '0.25rem' }}>
          {value} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {target}{unit}</span>
        </div>
      </div>
    );
  };

  if (!token || !user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🍺</span>
            <h2>Levantamento de Copo IA</h2>
            <p>Monitore seus macros diários com flexibilidade</p>
          </div>

          <div className="auth-tabs">
            <button 
              type="button" 
              className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
            >
              Entrar
            </button>
            <button 
              type="button" 
              className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
            >
              Criar Conta
            </button>
          </div>

          {authError && (
            <div className="auth-error">
              <AlertTriangle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            {authTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Seu nome"
                  value={authForm.name}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="seu@email.com"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Sua senha"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={authLoading}>
              {authLoading ? 'Processando...' : authTab === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <div className="demo-divider">
            <span>ou teste agora</span>
          </div>

          <button type="button" className="demo-btn" onClick={handleStartDemo}>
            Entrar no Modo Demo Offline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Sticky */}
      <header>
        <div className="header-container">
          <div className="logo-section">
            <span style={{ fontSize: '2rem' }}>🍺</span>
            <div>
              <h1>Levantamento de Copo IA</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Macros Flexíveis MVP</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Boas-vindas ao Usuário */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Olá, <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong>
              </span>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Sair
              </button>
            </div>

            {/* Status do Backend indicator */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.75rem', 
                background: backendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: backendOnline ? 'var(--color-standard)' : '#ef4444',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              <div 
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: backendOnline ? 'var(--color-standard)' : '#ef4444' 
                }} 
              />
              {backendOnline ? 'API Conectada' : 'Modo Demonstração Offline'}
            </div>

            <nav className="nav-tabs">
              <button 
                id="tab-daily-view"
                className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`} 
                onClick={() => setActiveTab('daily')}
              >
                Diário
              </button>
              <button 
                id="tab-dashboard-view"
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        
        {/* TELA 1: DIÁRIO */}
        {activeTab === 'daily' && (
          <div>
            {/* Seletor de Data */}
            <div className="day-selector">
              <button className="icon-btn" onClick={handlePrevDay} id="btn-prev-day">
                <ChevronLeft size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '1.1rem', padding: 0 }}
                  id="date-picker-input"
                />
              </div>
              <button className="icon-btn" onClick={handleNextDay} id="btn-next-day">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Painel Circular de Progresso de Macros */}
            <section className="macro-summary-panel">
              {renderProgressRing(dailyData.totals.protein, dailyData.goals.protein, 'Proteína', 'var(--color-protein)')}
              {renderProgressRing(dailyData.totals.carbs, dailyData.goals.carbs, 'Carboidrato', 'var(--color-carbs)')}
              {renderProgressRing(dailyData.totals.fat, dailyData.goals.fat, 'Gordura', 'var(--color-fat)')}
              {renderProgressRing(dailyData.totals.calories, dailyData.goals.calories, 'Calorias', 'var(--color-calories)', ' kcal')}
            </section>

            {/* Grid Diário: Add Log & Lista de Consumo */}
            <div className="dashboard-grid">
              
              {/* Tabela de Macros Individuais */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Log de Consumos do Dia</h2>
                  <button className="btn btn-secondary" onClick={() => setShowGoalModal(true)} id="btn-adjust-goals">
                    <Settings size={16} /> Ajustar Metas
                  </button>
                </div>

                {dailyData.entries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Activity size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Nenhum registro adicionado para este dia.</p>
                  </div>
                ) : (
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>Alimento / Bebida</th>
                        <th>Tipo</th>
                        <th>Macros (P/C/G)</th>
                        <th>Calorias</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.entries.map((entry) => (
                        <tr key={entry.id} className="log-row">
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.description}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${entry.logType}`}>
                              {entry.logType === 'standard' ? 'Padrão' : entry.logType === 'snack' ? 'Lanche' : 'Copo'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--color-protein)' }}>{entry.protein}g</span> / {' '}
                            <span style={{ color: 'var(--color-carbs)' }}>{entry.carbs}g</span> / {' '}
                            <span style={{ color: 'var(--color-fat)' }}>{entry.fat}g</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{entry.calories} kcal</td>
                          <td>
                            <button 
                              className="icon-btn" 
                              style={{ color: '#ef4444' }} 
                              onClick={() => handleDeleteLog(entry.id)}
                              id={`delete-btn-${entry.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Formulário para Adicionar Consumo */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Adicionar Macros</h2>
                  <div className="nav-tabs" style={{ padding: '0.2rem' }}>
                    <button 
                      type="button"
                      className={`tab-btn ${inputMethod === 'manual' ? 'active' : ''}`}
                      onClick={() => setInputMethod('manual')}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                      id="input-method-manual"
                    >
                      Manual
                    </button>
                    <button 
                      type="button"
                      className={`tab-btn ${inputMethod === 'ai' ? 'active' : ''}`}
                      onClick={() => setInputMethod('ai')}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                      id="input-method-ai"
                    >
                      IA 🪄
                    </button>
                  </div>
                </div>

                {inputMethod === 'ai' ? (
                  <form onSubmit={handleEstimateAI}>
                    <div className="form-group">
                      <label htmlFor="ai-meal-desc">O que você comeu/bebeu?</label>
                      <textarea
                        id="ai-meal-desc"
                        rows="3"
                        placeholder="Ex: um prato com 200g de arroz, 100g de feijão e 150g de peito de frango..."
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        required
                        style={{ resize: 'vertical', width: '100%' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Descreva livremente os alimentos e quantidades em gramas, ml ou copos.
                      </span>
                    </div>

                    {aiError && (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={14} /> {aiError}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn" 
                      style={{ width: '100%', marginTop: '0.5rem' }} 
                      disabled={aiLoading}
                      id="btn-run-ai"
                    >
                      {aiLoading ? 'Analisando refeição...' : 'Estimar com IA 🪄'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddLog}>
                    {aiProvider && (
                      <div style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        borderRadius: '8px', 
                        padding: '0.75rem', 
                        marginBottom: '1rem', 
                        fontSize: '0.85rem',
                        color: 'var(--color-standard)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>✓ Estimado por <strong>{aiProvider}</strong>. Revise abaixo.</span>
                        <button 
                          type="button" 
                          onClick={() => setAiProvider('')} 
                          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="log-desc">Descrição</label>
                      <input 
                        id="log-desc"
                        type="text" 
                        placeholder="Ex: Whey com Aveia, Caneca de Chopp..." 
                        value={newLog.description}
                        onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="log-type-select">Tipo de Consumo</label>
                      <select 
                        id="log-type-select"
                        value={newLog.logType} 
                        onChange={(e) => setNewLog({ ...newLog, logType: e.target.value, protein: 0, carbs: 0, fat: 0, calories: 0 })}
                      >
                        <option value="standard">Padrão (Focado na Dieta)</option>
                        <option value="snack">Lanche Extra (Fim de Semana)</option>
                        <option value="alcohol">Consumo Alcoólico (Levantamento de Copo)</option>
                      </select>
                    </div>

                    {newLog.logType === 'alcohol' ? (
                      <div className="form-group">
                        <label htmlFor="log-cal">Calorias Diretas (kcal)</label>
                        <input 
                          id="log-cal"
                          type="number" 
                          min="0"
                          placeholder="Ex: 150 kcal"
                          value={newLog.calories || ''}
                          onChange={(e) => setNewLog({ ...newLog, calories: parseInt(e.target.value) || 0 })}
                          required
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          * Bebidas alcoólicas são trackeadas principalmente pelo aporte de calorias vazias no saldo semanal.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="log-prot">Proteína (g)</label>
                            <input 
                              id="log-prot"
                              type="number" 
                              min="0" 
                              value={newLog.protein || ''} 
                              onChange={(e) => setNewLog({ ...newLog, protein: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="log-carbs">Carbo (g)</label>
                            <input 
                              id="log-carbs"
                              type="number" 
                              min="0" 
                              value={newLog.carbs || ''} 
                              onChange={(e) => setNewLog({ ...newLog, carbs: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="log-fat">Gordura (g)</label>
                            <input 
                              id="log-fat"
                              type="number" 
                              min="0" 
                              value={newLog.fat || ''} 
                              onChange={(e) => setNewLog({ ...newLog, fat: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Calorias (Calc)</label>
                            <input 
                              type="number" 
                              readOnly 
                              value={newLog.calories} 
                              style={{ background: 'hsla(217, 33%, 20%, 0.3)', cursor: 'not-allowed' }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }} id="btn-submit-log">
                      <Plus size={18} /> Registrar Consumo
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TELA 2: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Controles de Período do Dashboard */}
            <div className="day-selector" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--color-calories)' }} />
                <span className="day-selector-date">Consolidado Nutricional</span>
              </div>
              <div className="nav-tabs">
                <button 
                  id="btn-period-week"
                  className={`tab-btn ${dashPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setDashPeriod('week')}
                >
                  Semanal
                </button>
                <button 
                  id="btn-period-month"
                  className={`tab-btn ${dashPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setDashPeriod('month')}
                >
                  Mensal
                </button>
              </div>
            </div>

            {/* Sumário do Dashboard */}
            <section className="dashboard-grid">
              
              {/* Gráficos Empilhados Personalizados */}
              <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                  Aporte de Calorias e Desvios por Período
                </h2>
                
                <div className="weekly-bar-container">
                  {dashData.map((period, index) => {
                    const deviationCalories = period.deviations.alcoholCalories + period.deviations.snackCalories;
                    const cleanCalories = period.totals.calories - deviationCalories;
                    const totalPeriodCalories = Math.max(1, period.totals.calories);
                    
                    const cleanPct = (cleanCalories / totalPeriodCalories) * 100;
                    const snackPct = (period.deviations.snackCalories / totalPeriodCalories) * 100;
                    const alcoholPct = (period.deviations.alcoholCalories / totalPeriodCalories) * 100;

                    return (
                      <div className="bar-row" key={index}>
                        <div className="bar-header">
                          <span style={{ fontWeight: 600 }}>
                            {period.period_start.split('-').reverse().slice(0,2).join('/')} a {period.period_end.split('-').reverse().slice(0,2).join('/')}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {period.totals.calories} kcal
                          </span>
                        </div>
                        <div className="bar-track">
                          <div 
                            className="bar-fill-standard" 
                            style={{ width: `${cleanPct}%` }} 
                            title={`Dieta Limpa: ${cleanCalories} kcal`}
                          />
                          <div 
                            className="bar-fill-snack" 
                            style={{ width: `${snackPct}%` }} 
                            title={`Lanches Extras: ${period.deviations.snackCalories} kcal`}
                          />
                          <div 
                            className="bar-fill-alcohol" 
                            style={{ width: `${alcoholPct}%` }} 
                            title={`Consumo Alcoólico: ${period.deviations.alcoholCalories} kcal`}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', background: 'var(--color-standard)', borderRadius: '50%' }} />
                            Dieta Limpa ({Math.round(cleanPct)}%)
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', background: 'var(--color-snack)', borderRadius: '50%' }} />
                            Extra Lanches ({Math.round(snackPct)}%)
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '8px', height: '8px', background: 'var(--color-alcohol)', borderRadius: '50%' }} />
                            Álcool ({Math.round(alcoholPct)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informações de Desvio */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    Análise de Flexibilidade
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    O sistema de Levantamento de Copo avalia o quanto os seus desvios de fim de semana impactam o seu déficit ou superávit acumulado.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(38, 92, 50, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(38, 92, 50, 0.2)', display: 'flex', gap: '0.75rem' }}>
                      <Beer style={{ color: 'var(--color-alcohol)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Copo Acumulado</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-alcohol)' }}>
                          {dashData.reduce((acc, curr) => acc + curr.deviations.alcoholCalories, 0)} kcal
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(328, 90, 55, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(328, 90, 55, 0.2)', display: 'flex', gap: '0.75rem' }}>
                      <Apple style={{ color: 'var(--color-snack)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Extras Lanches</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-snack)' }}>
                          {dashData.reduce((acc, curr) => acc + curr.deviations.snackCalories, 0)} kcal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', background: 'rgba(210, 100, 60, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-carbs)', flexShrink: 0 }} />
                  <span>Dica: Tente manter as calorias alcoólicas abaixo de 10% do seu aporte semanal total para não prejudicar a síntese proteica.</span>
                </div>
              </div>

            </section>
          </div>
        )}

      </main>

      {/* MODAL DE AJUSTE DE METAS */}
      {showGoalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ajustar Metas Diárias</h2>
            <form onSubmit={handleSaveGoal}>
              <div className="form-group">
                <label htmlFor="goal-prot">Proteína Alvo (g)</label>
                <input 
                  id="goal-prot"
                  type="number" 
                  value={goalForm.proteinTarget} 
                  onChange={(e) => setGoalForm({ ...goalForm, proteinTarget: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="goal-carbs">Carboidrato Alvo (g)</label>
                <input 
                  id="goal-carbs"
                  type="number" 
                  value={goalForm.carbsTarget} 
                  onChange={(e) => setGoalForm({ ...goalForm, carbsTarget: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="goal-fat">Gordura Alvo (g)</label>
                <input 
                  id="goal-fat"
                  type="number" 
                  value={goalForm.fatTarget} 
                  onChange={(e) => setGoalForm({ ...goalForm, fatTarget: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="goal-cal">Calorias Alvo (kcal)</label>
                <input 
                  id="goal-cal"
                  type="number" 
                  value={goalForm.caloriesTarget} 
                  onChange={(e) => setGoalForm({ ...goalForm, caloriesTarget: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowGoalModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ flex: 1 }} id="btn-save-goal-modal">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
