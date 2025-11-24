import { Request, Response } from 'express';
import axios from 'axios';

export const getAstroData = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat || '-23.5475'; 
    const lon = req.query.lon || '-46.6361';

    // AQUI ESTÁ A MÁGICA:
    // Em vez de importar bibliotecas complexas, montamos a URL pedindo o que queremos.
    // 'hourly=temperature_2m,relative_humidity_2m' pede os dados por hora.
    // 'current=cloud_cover' pede a nuvem agora.
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m&current=cloud_cover,is_day&timezone=America/Sao_Paulo`;
    
    const response = await axios.get(openMeteoUrl);
    
    // O axios já converte o JSON pra gente. Muito mais simples!
    const dados = response.data;
    const horaAtual = dados.current;
    const previsaoHoraria = dados.hourly;

    // Lógica do Score (Simplificada)
    const cloudCover = horaAtual.cloud_cover;
    const isGoodVision = cloudCover < 20;

    res.status(200).json({
      location: { lat, lon },
      agora: {
        temperatura: previsaoHoraria.temperature_2m[0], // Pega a primeira temperatura da lista
        nuvens: cloudCover,
        umidade: previsaoHoraria.relative_humidity_2m[0],
        e_dia: horaAtual.is_day === 1
      },
      // Aqui enviamos a lista das próximas horas para você fazer gráfico no Front-end se quiser
      grafico: {
        horarios: previsaoHoraria.time.slice(0, 5), // Manda só as próximas 5 horas para não pesar
        temperaturas: previsaoHoraria.temperature_2m.slice(0, 5)
      },
      astronomy_score: {
        condition: isGoodVision ? 'Céu Limpo 🌟' : 'Muitas Nuvens ☁️',
        score: 100 - cloudCover
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar dados do clima.' });
  }
};