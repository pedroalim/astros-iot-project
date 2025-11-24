# 🔭 AstroView

**Assistente de Observação Astronômica & Monitoramento Ambiental**

O **AstroView** é uma aplicação Full Stack de IoT e Web que analisa condições meteorológicas e atmosféricas em tempo real para determinar a viabilidade de observações astronômicas. O sistema cruza dados de nebulosidade, umidade, temperatura e poluição do ar (PM2.5) para gerar um **Score de Visibilidade** inteligente.

![Status do Projeto](https://img.shields.io/badge/Status-Concluído-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Node.js-TypeScript-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 📸 Screenshots

*(Espaço reservado para screenshots do dashboard)*

---

## 🚀 Funcionalidades

### 🌍 Monitoramento Global
- **Busca Geocodificada:** Localize qualquer cidade do mundo e obtenha dados precisos de latitude/longitude automaticamente.
- **Fuso Horário Automático:** Detecção inteligente de dia/noite baseada na localização buscada com indicação visual (ícones de Sol/Lua).

### 🔭 Análise Astronômica (Diferencial)
- **Score de Visibilidade (0-100):** Algoritmo personalizado que pondera nuvens e poluição para dizer se o céu está bom para telescópios.
- **Efemérides:** Horários precisos de Nascer/Pôr do Sol.
- **Fase da Lua:** Cálculo matemático próprio (algoritmo de Data Juliana) para determinar a fase da lua atual e exibir o ícone correspondente sem depender de APIs externas limitadas.

### 📊 Dashboard de Dados
- **Gráficos Interativos (Chart.js):**
  - *Termodinâmica:* Cruzamento de Temperatura vs. Umidade para as próximas 12h.
  - *Visibilidade:* Relação entre Cobertura de Nuvens vs. Distância de Visibilidade (km).
- **Monitoramento de Poluição:** Exibição em tempo real de partículas finas (PM2.5) com alertas visuais (Verde/Vermelho).

### 🎨 UX/UI Moderna
- **Design Responsivo:** Layout adaptável (Mobile/Desktop) utilizando Grid System.
- **Modo Noturno (Red Mode):** Funcionalidade exclusiva para astrônomos que altera toda a paleta de cores para tons de vermelho e fundo preto, preservando a dilatação da pupila no escuro.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma arquitetura **BFF (Backend for Frontend)** para segurança, tratamento de dados e robustez.

### Front-end (Interface)
- **Vite:** Ferramenta de build de alta performance.
- **TypeScript:** Para tipagem estática e prevenção de erros.
- **Tailwind CSS:** Framework de estilização utility-first (responsividade e temas).
- **Chart.js:** Biblioteca para renderização de gráficos de dados vetoriais.

### Back-end (API & Lógica)
- **Node.js & Express:** Servidor REST API leve e escalável.
- **Axios:** Cliente HTTP para comunicação com APIs externas.
- **CORS:** Gerenciamento de segurança de requisições entre domínios.

### APIs Externas (Open Data)
- **Open-Meteo Weather API:** Dados meteorológicos.
- **Open-Meteo Geocoding API:** Conversão de nomes de cidades em coordenadas.
- **Open-Meteo Air Quality API:** Dados de poluição atmosférica.

---

## 📂 Estrutura do Projeto

```bash
projeto-iot/
├── api/                 # Back-end (Servidor Node.js)
│   ├── src/
│   │   ├── controllers/ # Lógica de negócio, cálculos e chamadas externas
│   │   ├── routes/      # Definição dos endpoints da API
│   │   └── server.ts    # Configuração do servidor Express
│   └── package.json
│
└── app/                 # Front-end (Interface Visual)
    ├── src/
    │   ├── main.ts      # Lógica do DOM, consumo da API interna e Gráficos
    │   └── style.css    # Diretivas do Tailwind CSS e Red Mode
    ├── index.html       # Estrutura HTML base
    └── package.json
``` 

