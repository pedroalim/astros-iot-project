import { Request, Response } from 'express';
import axios from 'axios';

// --- FUNÇÃO AUXILIAR: CALCULAR FASE DA LUA (Sem depender de API) ---
function getMoonPhase(date: Date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 3) {
    year--;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  const daysSinceNew = jd - 2451549.5;
  const cycles = daysSinceNew / 29.53;
  const phaseIndex = cycles - Math.floor(cycles);

  // Retorna o nome e o ícone
  if (phaseIndex < 0.03) return { name: 'Lua Nova', icon: '🌑' };
  if (phaseIndex < 0.25) return { name: 'Crescente', icon: '🌒' };
  if (phaseIndex < 0.28) return { name: 'Q. Crescente', icon: '🌓' };
  if (phaseIndex < 0.47) return { name: 'Gibosa', icon: '🌔' };
  if (phaseIndex < 0.53) return { name: 'Lua Cheia', icon: '🌕' };
  if (phaseIndex < 0.75) return { name: 'Gibosa', icon: '🌖' };
  if (phaseIndex < 0.78) return { name: 'Q. Minguante', icon: '🌗' };
  return { name: 'Minguante', icon: '🌘' };
}

export const getAstroData = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat ? String(req.query.lat) : '-23.5475'; 
    const lon = req.query.lon ? String(req.query.lon) : '-46.6361';

    // 1. CONFIGURAÇÃO CORRIGIDA (Sem Lua, apenas Sol)
    const weatherParams = {
      latitude: lat,
      longitude: lon,
      hourly: 'temperature_2m,relative_humidity_2m,cloud_cover,visibility',
      daily: 'sunrise,sunset', // REMOVIDO moonrise/moonset para corrigir o erro
      current: 'cloud_cover,is_day',
      timezone: 'auto'
    };

    const airParams = {
      latitude: lat,
      longitude: lon,
      current: 'pm2_5'
    };

    // Chamadas API
    const [weatherRes, airRes] = await Promise.all([
      axios.get('https://api.open-meteo.com/v1/forecast', { params: weatherParams }),
      axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', { params: airParams })
    ]);
    
    const clima = weatherRes.data;
    const ar = airRes.data;

    // --- PROCESSAMENTO DE DADOS ---
    const limit = 12;
    const horas = clima.hourly.time.slice(0, limit).map((t: string) => t.split('T')[1]);
    const temps = clima.hourly.temperature_2m.slice(0, limit);
    const nuvensGraph = clima.hourly.cloud_cover.slice(0, limit);
    const umidadeGraph = clima.hourly.relative_humidity_2m.slice(0, limit);
    // Evita erro se visibility for null (algumas cidades não tem)
    const visibilidadeGraph = clima.hourly.visibility 
      ? clima.hourly.visibility.slice(0, limit).map((v: number) => v / 1000)
      : Array(limit).fill(10); // Valor padrão

    // Score
    const nuvens = clima.current.cloud_cover;
    const poluicao = ar.current.pm2_5;
    let score = 100 - nuvens - (poluicao * 2);
    if (score < 0) score = 0;

    let condicao = '';
    let mensagem = '';
    if (score > 80) { condicao = 'Céu Perfeito 🔭'; mensagem = 'Condições ideais! Prepare o equipamento.'; }
    else if (score > 50) { condicao = 'Razoável 😐'; mensagem = 'Alguma interferência, mas observável.'; }
    else { condicao = 'Ruim ☁️'; mensagem = 'Visibilidade comprometida por nuvens ou poluição.'; }

    const formatTime = (isoString: string) => isoString ? isoString.split('T')[1] : '--:--';

    // CÁLCULO MANUAL DA LUA
    const moonData = getMoonPhase(new Date());

    res.status(200).json({
      location: { lat, lon },
      agora: {
        temperatura: clima.hourly.temperature_2m[0],
        nuvens: nuvens,
        umidade: clima.hourly.relative_humidity_2m[0],
        poluicao: poluicao,
        e_dia: clima.current.is_day === 1
      },
      astro: {
        nascer_sol: formatTime(clima.daily.sunrise ? clima.daily.sunrise[0] : null),
        por_sol: formatTime(clima.daily.sunset ? clima.daily.sunset[0] : null),
        fase_lua: moonData.name, // Usando nosso cálculo
        icone_lua: moonData.icon // Usando nosso ícone
      },
      grafico: {
        horas: horas,
        temperaturas: temps,
        nuvens: nuvensGraph,
        umidade: umidadeGraph,
        visibilidade: visibilidadeGraph
      },
      astronomy_score: {
        condition: condicao,
        message: mensagem,
        score: score
      }
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ message: 'Erro interno ao buscar dados.' });
  }
};