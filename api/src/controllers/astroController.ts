import { Request, Response } from 'express';
import axios from 'axios';

// Função da Lua (Mantida)
function getMoonPhase(date: Date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 3) { year--; month += 12; }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  const daysSinceNew = jd - 2451549.5;
  const cycles = daysSinceNew / 29.53;
  const phaseIndex = cycles - Math.floor(cycles);

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

    const weatherParams = {
      latitude: lat,
      longitude: lon,
      hourly: 'temperature_2m,relative_humidity_2m,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m',
      daily: 'sunrise,sunset', 
      // CORREÇÃO AQUI: Removi 'time' da lista. Ele já vem automático.
      current: 'cloud_cover,is_day,wind_speed_10m,surface_pressure', 
      timezone: 'auto'
    };

    const airParams = { latitude: lat, longitude: lon, current: 'pm2_5' };

    const [weatherRes, airRes] = await Promise.all([
      axios.get('https://api.open-meteo.com/v1/forecast', { params: weatherParams }),
      axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', { params: airParams })
    ]);
    
    const clima = weatherRes.data;
    const ar = airRes.data;

    // --- CORREÇÃO DO HORÁRIO (Sincronização) ---
    
    // 1. Descobrir que horas são na cidade pesquisada
    // O campo 'time' vem automático no objeto current
    const horaAtualIso = clima.current.time.slice(0, 13); // Ex: "2023-11-24T19"

    // 2. Achar em qual posição da lista está essa hora
    let startIndex = clima.hourly.time.findIndex((t: string) => t.startsWith(horaAtualIso));
    if (startIndex === -1) startIndex = 0;

    // 3. Pegar as próximas 12 horas a partir de agora
    const endIndex = startIndex + 12;

    // 4. Cortar os arrays
    const horas = clima.hourly.time.slice(startIndex, endIndex).map((t: string) => t.split('T')[1]);
    const temps = clima.hourly.temperature_2m.slice(startIndex, endIndex);
    const nuvensGraph = clima.hourly.cloud_cover.slice(startIndex, endIndex);
    const umidadeGraph = clima.hourly.relative_humidity_2m.slice(startIndex, endIndex);
    const ventoGraph = clima.hourly.wind_speed_10m.slice(startIndex, endIndex);
    const rajadasGraph = clima.hourly.wind_gusts_10m.slice(startIndex, endIndex);
    
    const visibilidadeGraph = clima.hourly.visibility 
      ? clima.hourly.visibility.slice(startIndex, endIndex).map((v: number) => v / 1000)
      : Array(12).fill(10);

    // Score e Lógica (Mantido igual)
    const nuvens = clima.current.cloud_cover;
    const poluicao = ar.current.pm2_5;
    let score = 100 - nuvens - (poluicao * 2);
    if (score < 0) score = 0;

    let condicao = '', mensagem = '', curiosidade = '';

    if (score > 80) { 
        condicao = 'Céu Perfeito 🔭'; 
        mensagem = 'Condições ideais! A estabilidade atmosférica está excelente.';
        curiosidade = 'Com este céu, tente observar aglomerados estelares como as Plêiades (M45).';
    } else if (score > 50) { 
        condicao = 'Razoável 😐'; 
        mensagem = 'Alguma interferência, mas planetas brilhantes (Júpiter/Vênus) são visíveis.'; 
        curiosidade = 'A turbulência pode fazer as estrelas "cintilarem" mais hoje.';
    } else { 
        condicao = 'Ruim ☁️'; 
        mensagem = 'Visibilidade comprometida por nuvens densas ou alta poluição.'; 
        curiosidade = 'Em dias nublados, astrônomos aproveitam para calibrar equipamentos.';
    }

    const formatTime = (isoString: string) => isoString ? isoString.split('T')[1] : '--:--';
    const moonData = getMoonPhase(new Date());

    res.status(200).json({
      location: { lat, lon },
      agora: {
        temperatura: clima.hourly.temperature_2m[startIndex], // Temperatura da hora exata
        nuvens: nuvens,
        umidade: clima.hourly.relative_humidity_2m[startIndex],
        poluicao: poluicao,
        e_dia: clima.current.is_day === 1,
        vento: clima.current.wind_speed_10m,
        pressao: clima.current.surface_pressure
      },
      astro: {
        nascer_sol: formatTime(clima.daily.sunrise ? clima.daily.sunrise[0] : null),
        por_sol: formatTime(clima.daily.sunset ? clima.daily.sunset[0] : null),
        fase_lua: moonData.name,
        icone_lua: moonData.icon
      },
      grafico: {
        horas: horas,
        temperaturas: temps,
        nuvens: nuvensGraph,
        umidade: umidadeGraph,
        visibilidade: visibilidadeGraph,
        vento: ventoGraph,
        rajadas: rajadasGraph
      },
      astronomy_score: {
        condition: condicao,
        message: mensagem,
        score: score,
        extra_text: curiosidade
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ message: 'Erro interno.' });
  }
};