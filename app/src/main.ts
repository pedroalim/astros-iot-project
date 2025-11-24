import './style.css'
import Chart from 'chart.js/auto';

const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('city-input') as HTMLInputElement;
const cityDisplay = document.getElementById('city-display') as HTMLParagraphElement;
const appDiv = document.querySelector<HTMLDivElement>('#app')!;
const btnToggle = document.getElementById('toggle-mode') as HTMLButtonElement;
const body = document.body;

let isRedMode = false;
let chartAtmosfera: Chart | null = null;
let chartVento: Chart | null = null; // NOVO GRÁFICO
let chartAstronomia: Chart | null = null;

async function searchCity(cityName: string) {
  try {
    cityDisplay.innerText = "Buscando...";
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=pt&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      alert('Cidade não encontrada!');
      cityDisplay.innerText = "Local desconhecido";
      return;
    }
    const city = data.results[0];
    cityDisplay.innerText = `${city.name}, ${city.country || ''}`;
    fetchAstroData(city.latitude, city.longitude);
  } catch (error) {
    console.error(error);
    cityDisplay.innerText = "Erro";
  }
}

async function fetchAstroData(lat: number, lon: number) {
  appDiv.innerHTML = `
    <div class="h-full w-full flex flex-col items-center justify-center animate-pulse gap-3">
      <p class="text-slate-400 text-xl font-medium">🔭 Analisando atmosfera...</p>
    </div>
  `;

  try {
    const response = await fetch(`http://localhost:3000/api/astro?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    const isDay = data.agora.e_dia; 
    const badgeColor = isDay ? 'bg-amber-500 text-amber-950' : 'bg-indigo-500 text-white';
    const labelDia = isDay ? '☀️ DIA' : '🌙 NOITE';
    const corPoluicao = data.agora.poluicao > 25 ? 'text-red-400' : 'text-emerald-400';
    let mainIcon = isDay ? (data.astronomy_score.score > 70 ? '☀️' : '🌥️') : (data.astronomy_score.score > 70 ? '✨' : '☁️');

    appDiv.innerHTML = `
      <div class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 animate-fade-in overflow-hidden">
        
        <div class="lg:col-span-4 bg-slate-800/50 p-6 border-r border-slate-700 relative flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            <div class="absolute top-6 right-6 px-3 py-1 rounded text-xs font-bold ${badgeColor}">
                ${labelDia}
            </div>

            <div class="text-center mt-2 mb-6">
                <span class="text-7xl drop-shadow-lg block mb-4 transition-transform hover:scale-110 duration-500">${mainIcon}</span>
                <h2 class="text-3xl md:text-4xl font-bold text-white leading-none mb-2">${data.astronomy_score.condition}</h2>
                <p class="text-slate-400 italic text-sm px-2 leading-relaxed">"${data.astronomy_score.message}"</p>
            </div>

            <div class="mb-6 space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-400">
                    <span>VISIBILIDADE ASTRONÔMICA</span>
                    <span class="text-white">${Math.round(data.astronomy_score.score)}/100</span>
                </div>
                <div class="w-full bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-500 h-full" style="width: ${data.astronomy_score.score}%"></div>
                </div>
            </div>

            <div class="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 mb-4 shadow-sm">
                <div class="text-center px-2">
                    <p class="text-2xl mb-1">🌅</p>
                    <p class="text-xs text-slate-300 font-bold">${data.astro.nascer_sol}</p>
                </div>
                <div class="text-center px-2 border-l border-r border-slate-700/50">
                    <p class="text-2xl mb-1">🌇</p>
                    <p class="text-xs text-slate-300 font-bold">${data.astro.por_sol}</p>
                </div>
                <div class="text-center px-2">
                    <p class="text-2xl mb-1" title="${data.astro.fase_lua}">${data.astro.icone_lua}</p>
                    <p class="text-xs text-slate-300 font-bold truncate max-w-[80px]">${data.astro.fase_lua}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-center">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Temperatura</p>
                    <p class="text-3xl font-bold text-white tracking-tight">${data.agora.temperatura}°</p>
                </div>
                <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-center">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Poluição PM2.5</p>
                    <p class="text-3xl font-bold ${corPoluicao} tracking-tight">${data.agora.poluicao}</p>
                </div>
            </div>

            <div class="mt-auto space-y-3 border-t border-slate-700/50 pt-4">
                <div class="grid grid-cols-2 gap-3 text-xs md:text-sm">
                    <div class="flex justify-between items-center bg-slate-800 p-3 rounded-lg shadow-sm">
                        <span class="text-slate-400 font-medium">💨 Vento</span>
                        <span class="font-bold text-slate-200">${data.agora.vento} km/h</span>
                    </div>
                    <div class="flex justify-between items-center bg-slate-800 p-3 rounded-lg shadow-sm">
                        <span class="text-slate-400 font-medium">📉 Pressão</span>
                        <span class="font-bold text-slate-200">${data.agora.pressao} hPa</span>
                    </div>
                </div>
                <div class="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20">
                    <p class="text-xs text-indigo-300 font-bold uppercase mb-2 flex items-center gap-2">💡 Dica do Astrônomo</p>
                    <p class="text-sm text-slate-300 leading-relaxed font-light">${data.astronomy_score.extra_text}</p>
                </div>
                <div class="text-center text-[10px] text-slate-600 font-mono pt-2">LAT: ${data.location.lat} | LON: ${data.location.lon}</div>
            </div>
        </div>

        <div class="lg:col-span-8 flex flex-col h-full bg-slate-800/30 overflow-y-auto">
            
            <div class="flex-1 p-5 border-b border-slate-700/50 relative min-h-[180px] flex flex-col">
                <h3 class="text-xs text-slate-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded w-fit shadow-sm">
                    🌡️ Termodinâmica (Temp vs Umidade)
                </h3>
                <div class="relative w-full flex-1"><canvas id="chartAtmosfera"></canvas></div>
            </div>

            <div class="flex-1 p-5 border-b border-slate-700/50 relative min-h-[180px] flex flex-col">
                <h3 class="text-xs text-slate-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded w-fit shadow-sm">
                    💨 Estabilidade (Vento vs Rajadas)
                </h3>
                <div class="relative w-full flex-1"><canvas id="chartVento"></canvas></div>
            </div>

            <div class="flex-1 p-5 relative min-h-[180px] flex flex-col">
                <h3 class="text-xs text-slate-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded w-fit shadow-sm">
                    👁️ Visibilidade (Nuvens vs Alcance)
                </h3>
                <div class="relative w-full flex-1"><canvas id="chartAstronomia"></canvas></div>
            </div>

        </div>
      </div>
    `;

    renderCharts(data.grafico);

  } catch (error) {
    console.error(error);
    appDiv.innerHTML = `<div class="h-full flex items-center justify-center text-red-400 font-bold">Erro de conexão.</div>`;
  }
}

function renderCharts(dados: any) {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.size = 11;
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
  
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: { legend: { display: false } },
    layout: { padding: { left: 0, right: 10, top: 10, bottom: 0 } }
  };

  // 1. Atmosfera
  const ctx1 = document.getElementById('chartAtmosfera') as HTMLCanvasElement;
  if (chartAtmosfera) chartAtmosfera.destroy();
  chartAtmosfera = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: dados.horas,
      datasets: [
        { label: 'Temp', data: dados.temperaturas, borderColor: '#fbbf24', backgroundColor: '#fbbf24', yAxisID: 'y', tension: 0.4, borderWidth: 3, pointRadius: 0 },
        { label: 'Umid', data: dados.umidade, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)', fill: true, yAxisID: 'y1', tension: 0.4, borderWidth: 2, pointRadius: 0 }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: { display: true, position: 'left', grid: { display: false } }, 
        y1: { display: true, position: 'right', min: 0, max: 100 }
      }
    }
  });

  // 2. Vento (NOVO)
  const ctx2 = document.getElementById('chartVento') as HTMLCanvasElement;
  if (chartVento) chartVento.destroy();
  chartVento = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: dados.horas,
      datasets: [
        { label: 'Rajadas', data: dados.rajadas, backgroundColor: 'rgba(248, 113, 113, 0.2)', borderColor: 'rgba(248, 113, 113, 0.5)', borderWidth: 1, borderRadius: 2, barPercentage: 0.6, order: 2 },
        { type: 'line', label: 'Vento', data: dados.vento, borderColor: '#f87171', borderWidth: 2, tension: 0.3, pointRadius: 0, order: 1 }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: { display: true, beginAtZero: true, grid: { display: false }, title: {display: true, text: 'km/h'} }
      }
    }
  });

  // 3. Astronomia
  const ctx3 = document.getElementById('chartAstronomia') as HTMLCanvasElement;
  if (chartAstronomia) chartAstronomia.destroy();
  chartAstronomia = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: dados.horas,
      datasets: [
        { label: 'Nuvens', data: dados.nuvens, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3, yAxisID: 'y', barPercentage: 0.7 },
        { type: 'line', label: 'Vis (km)', data: dados.visibilidade, borderColor: '#10b981', borderWidth: 3, yAxisID: 'y1', tension: 0.2, pointRadius: 0 }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false } },
        y: { min: 0, max: 100 }, 
        y1: { position: 'right', grid: { display: false } }
      }
    }
  });
}

form.addEventListener('submit', (e) => { e.preventDefault(); if(input.value) searchCity(input.value); });
btnToggle.addEventListener('click', () => {
  isRedMode = !isRedMode;
  if (isRedMode) { body.classList.add('red-mode'); btnToggle.innerText = 'Modo Normal'; }
  else { body.classList.remove('red-mode'); btnToggle.innerText = 'Modo Noturno'; }
});
fetchAstroData(-23.55, -46.63);