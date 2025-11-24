import './style.css'
import Chart from 'chart.js/auto';

// Elementos
const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('city-input') as HTMLInputElement;
const cityDisplay = document.getElementById('city-display') as HTMLParagraphElement;
const appDiv = document.querySelector<HTMLDivElement>('#app')!;
const btnToggle = document.getElementById('toggle-mode') as HTMLButtonElement;
const body = document.body;

let isRedMode = false;
let chartAtmosfera: Chart | null = null;
let chartAstronomia: Chart | null = null;

// --- BUSCA CIDADE ---
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
    cityDisplay.innerText = "Erro na busca";
  }
}

// --- BUSCAR DADOS E RENDERIZAR ---
async function fetchAstroData(lat: number, lon: number) {
  appDiv.innerHTML = `
    <div class="animate-pulse flex flex-col items-center py-10">
      <p class="text-slate-500 text-lg">🔭 Carregando dados do observatório...</p>
    </div>
  `;
  appDiv.className = 'w-full'; 

  try {
    const response = await fetch(`http://localhost:3000/api/astro?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    const isDay = data.agora.e_dia; 
    const badgeColor = isDay ? 'bg-amber-500 text-amber-950' : 'bg-indigo-500 text-white';
    const labelDia = isDay ? '☀️ DIA' : '🌙 NOITE';
    const corPoluicao = data.agora.poluicao > 25 ? 'text-red-400' : 'text-emerald-400';
    let mainIcon = isDay ? (data.astronomy_score.score > 70 ? '☀️' : '🌥️') : (data.astronomy_score.score > 70 ? '✨' : '☁️');

    appDiv.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
        
        <div class="lg:col-span-1 bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 relative flex flex-col justify-between h-full">
            
            <div class="absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold ${badgeColor}">
                ${labelDia}
            </div>

            <div>
                <div class="text-center mt-4">
                    <span class="text-7xl drop-shadow-lg">${mainIcon}</span>
                    <h2 class="text-3xl font-bold text-white mt-4 mb-1">${data.astronomy_score.condition}</h2>
                    <p class="text-slate-400 italic text-sm mb-6">"${data.astronomy_score.message}"</p>
                </div>

                <div class="mb-4">
                    <div class="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Visibilidade</span>
                        <span>${Math.round(data.astronomy_score.score)}/100</span>
                    </div>
                    <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-500 h-full" style="width: ${data.astronomy_score.score}%"></div>
                    </div>
                </div>

                <div class="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg mb-6 border border-slate-700/50">
                    <div class="text-center px-2">
                        <p class="text-xl">🌅</p>
                        <p class="text-[10px] text-slate-400 font-bold">${data.astro.nascer_sol}</p>
                    </div>
                    <div class="text-center px-2 border-l border-r border-slate-700/50">
                        <p class="text-xl">🌇</p>
                        <p class="text-[10px] text-slate-400 font-bold">${data.astro.por_sol}</p>
                    </div>
                    <div class="text-center px-2">
                        <p class="text-xl" title="${data.astro.fase_lua}">${data.astro.icone_lua}</p>
                        <p class="text-[10px] text-slate-400 font-bold truncate max-w-[60px]">${data.astro.fase_lua}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                        <p class="text-[10px] text-slate-500 uppercase">Temp</p>
                        <p class="text-2xl font-bold text-white">${data.agora.temperatura}°</p>
                    </div>
                    <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                        <p class="text-[10px] text-slate-500 uppercase">Poluição</p>
                        <p class="text-2xl font-bold ${corPoluicao}">${data.agora.poluicao}</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center text-[10px] text-slate-600 mt-2">
                Lat: ${data.location.lat} | Lon: ${data.location.lon}
            </div>
        </div>

        <div class="lg:col-span-2 flex flex-col gap-4">
            <div class="bg-slate-800 rounded-2xl shadow-xl p-5 border border-slate-700 flex-1 min-h-[250px]">
                <h3 class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    🌡️ Termodinâmica (12h)
                </h3>
                <div class="relative w-full h-48">
                    <canvas id="chartAtmosfera"></canvas>
                </div>
            </div>

            <div class="bg-slate-800 rounded-2xl shadow-xl p-5 border border-slate-700 flex-1 min-h-[250px]">
                <h3 class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    👁️ Qualidade de Observação
                </h3>
                <div class="relative w-full h-48">
                    <canvas id="chartAstronomia"></canvas>
                </div>
            </div>
        </div>
      </div>
    `;

    renderCharts(data.grafico);

  } catch (error) {
    console.error(error);
    appDiv.innerHTML = `<p class="text-red-400 p-4 bg-red-900/20 rounded">Erro de conexão.</p>`;
  }
}

function renderCharts(dados: any) {
  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

  const ctx1 = document.getElementById('chartAtmosfera') as HTMLCanvasElement;
  if (chartAtmosfera) chartAtmosfera.destroy();

  chartAtmosfera = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: dados.horas,
      datasets: [
        { label: 'Temp (°C)', data: dados.temperaturas, borderColor: '#fbbf24', backgroundColor: '#fbbf24', yAxisID: 'y', tension: 0.4 },
        { label: 'Umid (%)', data: dados.umidade, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, yAxisID: 'y1', tension: 0.4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 10 } } },
      scales: { y: { display: true, position: 'left', grid: { display: false } }, y1: { display: true, position: 'right', min: 0, max: 100 } }
    }
  });

  const ctx2 = document.getElementById('chartAstronomia') as HTMLCanvasElement;
  if (chartAstronomia) chartAstronomia.destroy();

  chartAstronomia = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: dados.horas,
      datasets: [
        { label: 'Nuvens (%)', data: dados.nuvens, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, yAxisID: 'y' },
        { type: 'line', label: 'Visibilidade (km)', data: dados.visibilidade, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, yAxisID: 'y1', tension: 0.2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 10 } } },
      scales: { y: { min: 0, max: 100 }, y1: { position: 'right', grid: { display: false } } }
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