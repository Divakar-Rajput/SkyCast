# 🌤️ SkyCast Weather

<div align="center">


**A stunning, fully-featured weather intelligence app — built in a single HTML file.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-API-orange?style=flat-square&logo=icloud&logoColor=white)](https://openweathermap.org/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=flat-square)]()

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## ✨ Overview

**SkyCast** is a real-time weather intelligence web app that feels like a native app — all delivered in a single, zero-dependency HTML file. It auto-detects your location on load, renders a Google-style scrollable temperature graph, shows a detailed 7-day forecast, and wraps everything in a dark glassmorphism UI with animated stars and floating orbs.

> 🚀 **One file. No build tools. No npm. Just open in a browser.**

---

## 🖼️ Features

### 🔍 Smart Search — In the Header
- City name or zip code search built directly into the sticky navigation bar
- Powered by the **OpenWeatherMap Geocoding API** for accurate coordinate resolution
- Press `Enter` or click **Search** to fetch weather instantly
- 📍 **GPS auto-detect button** — uses the browser Geolocation API

### 📍 Auto Location Detection
- On page load, Aether automatically requests GPS permission
- A live **pulsing banner** shows the detected city and country
- Gracefully falls back to a default city if permission is denied

### 🌡️ Real-Time Current Conditions
- Temperature with feels-like reading
- Weather condition with animated icon
- Humidity, wind speed & direction, pressure, cloud cover

### 📈 Google-Style Temperature Graph
- **Smooth bezier curve** with gradient fill — just like Google Weather
- **Horizontally scrollable** — drag or swipe to pan through time
- **3 time ranges**: 24h · 48h · 5 days
- Rain probability bars with percentage labels at the bottom
- Weather icons per time slot (☀️ ⛅ 🌧️ ❄️)
- **"NOW" dashed marker** in cyan highlighting current time
- Day divider lines with date labels when crossing midnight
- **Hover tooltips** — snap to any hour for temp, condition, and rain %
- Click-and-drag mouse panning support

### ⏰ Hourly Forecast
- Scrollable 12-step strip for the next ~36 hours
- Shows time label, weather icon, temperature, and rain % per slot
- Highlights the current hour with a distinct glow

### 📅 7-Day Weather Update
- Full day name and date for all 7 days
- Weather icon, description, high/low temperature
- Visual bar chart showing relative temperature range
- Rain probability % for each day

### 🌡️ Additional Data Panels
| Panel | Data |
|-------|------|
| **UV Index** | Estimated from cloud cover, color-coded Low → Very High |
| **Dew Point** | Calculated from temperature and humidity |
| **Min / Max Today** | From the current weather response |
| **Sun Schedule** | Sunrise & sunset in the city's local timezone |
| **Visibility** | In km with a progress bar (Excellent → Poor) |

### 🎨 Design System
- **Dark sky aesthetic** — deep navy background inspired by the night sky
- **Glassmorphism cards** — `backdrop-filter: blur` with translucent borders
- **Animated stars** — CSS radial gradients with a twinkle animation
- **Floating orbs** — ambient blur blobs that drift slowly
- **Micro-animations** — floating weather icon, fade-up card entrances, pulsing dot, spinner
- **Sticky header** — stays visible as you scroll
- **°C / °F toggle** — switches all values instantly
- **Live clock** — updates every second with the current time

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 — Variables, Grid, Flexbox, Animations, `backdrop-filter` |
| Logic | Vanilla JavaScript (ES6+) |
| Graphics | HTML5 Canvas 2D API |
| Location | Browser Geolocation API |
| Data | `fetch()` + OpenWeatherMap REST API |
| Fonts | Google Fonts — **Syne** (display) + **DM Sans** (body) |
| Build | None — zero build tools required |

---

## 🚀 Getting Started

### Prerequisites
- A free [OpenWeatherMap API key](https://openweathermap.org/api) (takes ~2 minutes to get)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/aether-weather.git
   cd aether-weather
   ```

2. **Add your API key**

   Open `weather-app.html` and replace the placeholder on line ~215:
   ```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```

3. **Open in browser**
   ```bash
   # Option A — just double-click the file
   open weather-app.html

   # Option B — serve locally (recommended to avoid CORS on some browsers)
   npx serve .
   # or
   python -m http.server 8080
   ```

4. **Allow location access** when prompted for auto-detection, or search for any city manually.

---

## 🌐 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /data/2.5/weather` | Current conditions — temp, wind, humidity, pressure, visibility, sunrise/sunset |
| `GET /data/2.5/forecast` | 5-day / 3-hour forecast — hourly data, daily aggregations, rain probability |
| `GET /geo/1.0/direct` | Geocoding — convert city name to lat/lon coordinates |

All endpoints use the **Free tier** of OpenWeatherMap — no paid plan required.

---

## 📁 Project Structure

```
aether-weather/
│
├── weather-app.html       # The entire app — HTML + CSS + JS in one file
├── README.md              # This file
└── LICENSE                # MIT License
```

---

## ⚙️ Configuration

You can customize these constants at the top of the `<script>` block:

```javascript
const API_KEY = 'your_key_here';        // OpenWeatherMap API key

// Default fallback city (used when GPS is denied)
// Change lat/lon to your preferred default location
fetchWeatherByCoords(28.6139, 77.2090); // Default: New Delhi, India
```

---

## 📸 Screenshots

> *(Add your own screenshots here after deployment)*

| Current Weather | Google-Style Graph | 7-Day Forecast |
|:-:|:-:|:-:|
| ![Current](screenshots/current.png) | ![Graph](screenshots/graph.png) | ![7day](screenshots/7day.png) |

---

## 🗺️ Roadmap

- [ ] PWA support — offline mode via Service Workers
- [ ] Weather alerts and severe condition warnings
- [ ] Multi-city comparison view
- [ ] Dark/light theme toggle
- [ ] Animated weather backgrounds (rain particles, snow, etc.)
- [ ] Share weather snapshot as image
- [ ] Pressure trend indicator (rising / falling)

---

## 🤝 Contributing

Contributions are welcome! Since this is a single-file project, the workflow is simple:

1. Fork the repository
2. Edit `weather-app.html`
3. Test in a browser
4. Open a pull request with a clear description of your change

Please keep the **zero-dependency** principle — no npm packages, no build steps.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/) — free weather data API
- [Google Fonts](https://fonts.google.com/) — Syne & DM Sans typefaces
- Inspired by the design language of Google Weather and Apple Weather

---

<div align="center">

Made with ☁️ by **Aether**

⭐ Star this repo if you found it useful!

</div>
