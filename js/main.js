
const API_KEY = '1e3e8f230b6064d27976e41163a82b77';
let unit = 'metric', lastCoords = null, chartData = null, hourlyData = null, activeGGDays = 1;

/* clock */
function tickClock() {
    const n = new Date();
    document.getElementById('clock').textContent = n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    document.getElementById('dateDisp').textContent = n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
tickClock(); setInterval(tickClock, 1000);

function setUnit(u) {
    unit = u;
    document.getElementById('btnC').classList.toggle('on', u === 'metric');
    document.getElementById('btnF').classList.toggle('on', u === 'imperial');
    if (lastCoords) fetchWeatherByCoords(lastCoords.lat, lastCoords.lon);
}

window.onload = () => {
    const b = document.getElementById('locBanner'); b.style.display = 'flex';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
            () => { b.style.display = 'none'; fetchWeatherByCoords(28.6139, 77.2090); },
            { timeout: 7000 }
        );
    } else { b.style.display = 'none'; fetchWeatherByCoords(28.6139, 77.2090); }
};

function getLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    showLoading('Detecting location…');
    const b = document.getElementById('locBanner');
    b.style.display = 'flex'; document.getElementById('locText').textContent = 'Detecting your location…';
    navigator.geolocation.getCurrentPosition(
        p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
        () => showError('Location access denied.')
    );
}

function fetchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;
    showLoading('Searching for ' + city + '…');
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`)
        .then(r => r.json()).then(d => {
            if (!d.length) throw new Error('City not found');
            fetchWeatherByCoords(d[0].lat, d[0].lon);
        }).catch(e => showError(e.message));
}

function fetchWeatherByCoords(lat, lon) {
    lastCoords = { lat, lon };
    Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&cnt=56&appid=${API_KEY}`).then(r => r.json())
    ]).then(([cur, fc]) => {
        if (cur.cod !== 200) throw new Error(cur.message || 'API error');
        const b = document.getElementById('locBanner');
        b.style.display = 'flex';
        document.getElementById('locText').textContent = `📍 Auto-detected: ${cur.name}, ${cur.sys.country}`;
        document.getElementById('cityInput').value = cur.name;
        renderWeather(cur, fc);
    }).catch(e => showError(e.message));
}

function showLoading(msg = 'Fetching weather…') {
    document.getElementById('content').innerHTML = `<div class="sbox"><div class="spin"></div><div class="st2">${msg}</div><div class="sm">Getting the latest data…</div></div>`;
}
function showError(msg) {
    document.getElementById('content').innerHTML = `<div class="sbox"><span class="si2">⚠️</span><div class="st2">Something went wrong</div><div class="sm">${msg}</div></div>`;
}

const WI = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '🌤️', '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️', '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️'
};
const wico = c => WI[c] || '🌡️';
function fmtTime(ts, off) { return new Date((ts + off) * 1000).toUTCString().slice(17, 22); }
function wdir(d) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((d || 0) / 45) % 8]; }

function buildDaily(list) {
    const days = {};
    list.forEach(x => {
        const k = new Date(x.dt * 1000).toDateString();
        if (!days[k]) days[k] = { hi: [], lo: [], ic: [], dc: [], hm: [], wd: [], pp: [] };
        days[k].hi.push(x.main.temp_max); days[k].lo.push(x.main.temp_min);
        days[k].ic.push(x.weather[0].icon); days[k].dc.push(x.weather[0].description);
        days[k].hm.push(x.main.humidity); days[k].wd.push(x.wind.speed);
        days[k].pp.push((x.pop || 0) * 100);
    });
    return Object.entries(days).slice(0, 7).map(([day, d], i) => ({
        label: i === 0 ? 'Today' : new Date(day).toLocaleDateString('en-US', { weekday: 'long' }),
        short: i === 0 ? 'Today' : new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: Math.round(Math.max(...d.hi)), low: Math.round(Math.min(...d.lo)),
        icon: wico(d.ic[Math.floor(d.ic.length / 2)]),
        desc: d.dc[Math.floor(d.dc.length / 2)],
        hum: Math.round(d.hm.reduce((a, b) => a + b) / d.hm.length),
        wind: Math.round(d.wd.reduce((a, b) => a + b) / d.wd.length * 10) / 10,
        pop: Math.round(Math.max(...d.pp))
    }));
}

/* ─── MAIN RENDER ─── */
function renderWeather(c, f) {
    const sym = unit === 'metric' ? '°C' : '°F';
    chartData = buildDaily(f.list);
    hourlyData = f.list; // raw 3h entries

    /* 7-day list */
    const mxH = Math.max(...chartData.map(d => d.high)), mnL = Math.min(...chartData.map(d => d.low));
    const sevenHTML = chartData.map((d, i) => {
        const bp = mxH === mnL ? 50 : Math.round(((d.high - mnL) / (mxH - mnL)) * 100);
        return `<div class="dayrow">
      <div><div class="dname ${i === 0 ? 'today' : ''}">${d.label}</div><div class="ddate">${d.date}</div></div>
      <div class="dico">${d.icon}</div>
      <div class="dbar"><span class="dlo">${d.low}°</span><div class="dtrack"><div class="dfill" style="width:${bp}%"></div></div><span class="dhi">${d.high}°</span></div>
      <div class="ddesc">${d.desc}</div>
      <div class="drain">${d.pop > 0 ? '💧' + d.pop + '%' : ''}</div>
    </div>`;
    }).join('');

    const uvi = Math.round((1 - c.clouds.all / 100) * 10);
    const uvC = uvi <= 2 ? '#4fc3f7' : uvi <= 5 ? '#ffd54f' : uvi <= 7 ? '#ff8a65' : '#ef5350';
    const uvL = uvi <= 2 ? 'Low' : uvi <= 5 ? 'Moderate' : uvi <= 7 ? 'High' : 'Very High';
    const vis = (c.visibility / 1000).toFixed(1);
    const visPct = Math.min(100, (c.visibility / 10000) * 100);
    const visL = c.visibility >= 10000 ? 'Excellent' : c.visibility >= 5000 ? 'Good' : c.visibility >= 2000 ? 'Moderate' : 'Poor';
    const wSpd = unit === 'metric' ? `${c.wind.speed} m/s` : `${c.wind.speed} mph`;
    const dewPt = Math.round(c.main.temp - ((100 - c.main.humidity) / 5));

    document.getElementById('content').innerHTML = `

    <!-- Current weather -->
    <div class="main-card">
      <div class="cg"></div>
      <div class="locrow"><span class="locname">${c.name}</span><span class="locctr">${c.sys.country}</span></div>
      <div class="condlbl">${c.weather[0].description}</div>
      <div class="temprow">
        <div class="tmain">${Math.round(c.main.temp)}<sup>${sym}</sup></div>
        <div class="wiwrap"><div class="wi">${wico(c.weather[0].icon)}</div><div class="feelike">Feels like ${Math.round(c.main.feels_like)}${sym}</div></div>
      </div>
      <div class="sgrid">
        <div class="st"><div class="si">💧</div><div class="sv">${c.main.humidity}%</div><div class="sl">Humidity</div></div>
        <div class="st"><div class="si">💨</div><div class="sv">${wSpd}</div><div class="sl">Wind ${wdir(c.wind.deg)}</div></div>
        <div class="st"><div class="si">📊</div><div class="sv">${c.main.pressure}</div><div class="sl">hPa</div></div>
        <div class="st"><div class="si">☁️</div><div class="sv">${c.clouds.all}%</div><div class="sl">Clouds</div></div>
      </div>
    </div>

    <!-- Google-style graph -->
    <div class="gg-card">
      <div class="gg-head">
        <div class="sec-title">Temperature Forecast</div>
        <div class="gg-days" id="ggDays">
          <button class="gg-day-btn on" onclick="setGGDays(1,this)">24h</button>
          <button class="gg-day-btn"    onclick="setGGDays(2,this)">48h</button>
          <button class="gg-day-btn"    onclick="setGGDays(5,this)">5 days</button>
        </div>
      </div>
      <div class="gg-scroll-outer" id="ggScroll">
        <div class="gg-inner" id="ggInner">
          <canvas class="gg-canvas" id="ggCanvas"></canvas>
          <div class="gg-tip" id="ggTip">
            <div class="gg-tip-time" id="ttTime"></div>
            <div class="gg-tip-temp" id="ttTemp"></div>
            <div class="gg-tip-cond" id="ttCond"></div>
            <div class="gg-tip-rain" id="ttRain"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7-day list -->
    <div class="seven-card">
      <div class="sec-title" style="margin-bottom:14px">7-Day Weather Update</div>
      ${sevenHTML}
    </div>

    <!-- Indicators -->
    <div class="ind-row">
      <div class="ind-card"><div class="int">UV Index</div><div class="inv" style="color:${uvC}">${uvi}</div><div class="ind">${uvL}</div></div>
      <div class="ind-card"><div class="int">Dew Point</div><div class="inv" style="color:var(--accent2)">${dewPt}°</div><div class="ind">${sym}</div></div>
      <div class="ind-card"><div class="int">Min / Max</div><div class="inv" style="font-size:17px">${Math.round(c.main.temp_min)}° / ${Math.round(c.main.temp_max)}°</div><div class="ind">Today</div></div>
    </div>

    <!-- Sun + Visibility -->
    <div class="bot-grid">
      <div class="mini-card">
        <div class="mct">Sun Schedule</div>
        <div class="sunrow">
          <div class="suni"><div class="sunbi">🌅</div><div class="sunt">${fmtTime(c.sys.sunrise, c.timezone)}</div><div class="sunl">Sunrise</div></div>
          <div class="sdiv"></div>
          <div class="suni"><div class="sunbi">🌇</div><div class="sunt">${fmtTime(c.sys.sunset, c.timezone)}</div><div class="sunl">Sunset</div></div>
        </div>
      </div>
      <div class="mini-card">
        <div class="mct">Visibility</div>
        <div class="visv">${vis}<span style="font-size:13px;color:var(--muted)"> km</span></div>
        <div class="visd">${visL} visibility</div>
        <div class="pbar"><div class="pfill" style="width:${visPct}%"></div></div>
      </div>
    </div>`;

    setTimeout(() => drawGG(activeGGDays), 60);
    enableGGDrag();
}

/* ═══════════════════════════════════════════
   GOOGLE-STYLE GRAPH
═══════════════════════════════════════════ */
function setGGDays(days, btn) {
    activeGGDays = days;
    document.querySelectorAll('.gg-day-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    drawGG(days);
}

function drawGG(days) {
    if (!hourlyData) return;
    const canvas = document.getElementById('ggCanvas');
    const scroll = document.getElementById('ggScroll');
    const inner = document.getElementById('ggInner');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;

    /* pick entries */
    const maxPts = days * 8; // 8 entries per day (3h)
    const entries = hourlyData.slice(0, maxPts);
    const n = entries.length;

    /* dimensions */
    const COL_W = 72;      // px per column
    const H = 300;     // canvas CSS height
    const PAD = { top: 68, right: 40, bottom: 100, left: 48 };
    const W = Math.max(PAD.left + n * COL_W + PAD.right, scroll.clientWidth);

    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    inner.style.width = W + 'px';
    inner.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    /* data */
    const temps = entries.map(e => e.main.temp);
    const pops = entries.map(e => (e.pop || 0) * 100);
    const minT = Math.min(...temps), maxT = Math.max(...temps);
    const rng = Math.max(maxT - minT, 2);
    const lo = minT - rng * 0.18;
    const hi = maxT + rng * 0.28;

    const toX = i => PAD.left + i * COL_W + COL_W / 2;
    const toY = v => PAD.top + (H - PAD.top - PAD.bottom) * (1 - (v - lo) / (hi - lo));
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    /* ── background subtle grid ── */
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let j = 0; j <= 4; j++) {
        const y = PAD.top + chartH / 4 * j;
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
        const tv = hi - (hi - lo) * (j / 4);
        ctx.fillStyle = 'rgba(232,244,253,0.22)';
        ctx.font = `10px 'DM Sans',sans-serif`; ctx.textAlign = 'right';
        ctx.fillText(Math.round(tv) + '°', PAD.left - 6, y + 4);
    }

    /* ── rain bars (bottom) ── */
    const barMaxH = 28;
    const barBase = H - PAD.bottom + 14;
    pops.forEach((p, i) => {
        if (p <= 0) return;
        const bh = barMaxH * (p / 100);
        const bx = toX(i) - 10;
        const by = barBase - bh;
        const grad = ctx.createLinearGradient(0, by, 0, barBase);
        grad.addColorStop(0, 'rgba(79,195,247,0.7)');
        grad.addColorStop(1, 'rgba(79,195,247,0.15)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx, by, 20, bh, 3) : ctx.rect(bx, by, 20, bh);
        ctx.fill();
        if (p >= 20) {
            ctx.fillStyle = 'rgba(129,212,250,0.75)';
            ctx.font = `9px 'DM Sans',sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(Math.round(p) + '%', toX(i), barBase + 13);
        }
    });

    /* ── temperature curve fill ── */
    const gradFill = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    gradFill.addColorStop(0, 'rgba(255,138,101,0.32)');
    gradFill.addColorStop(0.5, 'rgba(79,195,247,0.12)');
    gradFill.addColorStop(1, 'rgba(79,195,247,0.0)');

    /* bezier path helper */
    function buildPath(pts) {
        ctx.beginPath();
        pts.forEach((p, i) => {
            if (i === 0) { ctx.moveTo(p.x, p.y); return; }
            const pp = pts[i - 1];
            const cpx = (pp.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, pp.y, cpx, p.y, p.x, p.y);
        });
    }

    const pts = temps.map((t, i) => ({ x: toX(i), y: toY(t) }));

    /* fill */
    ctx.save();
    buildPath(pts);
    ctx.lineTo(toX(n - 1), PAD.top + chartH);
    ctx.lineTo(toX(0), PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradFill;
    ctx.fill();
    ctx.restore();

    /* glow line */
    ctx.save();
    buildPath(pts);
    ctx.strokeStyle = 'rgba(255,138,101,0.2)';
    ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* main line */
    ctx.save();
    buildPath(pts);
    ctx.strokeStyle = '#ff8a65';
    ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* ── "now" vertical marker ── */
    const nowX = toX(0);
    ctx.strokeStyle = 'rgba(79,195,247,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(nowX, PAD.top - 10); ctx.lineTo(nowX, PAD.top + chartH + 6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(79,195,247,0.85)';
    ctx.font = `bold 9px 'Syne',sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('NOW', nowX, PAD.top - 14);

    /* ── dots + temps + icons + time labels ── */
    entries.forEach((e, i) => {
        const x = toX(i), y = toY(e.main.temp);
        const isNow = i === 0;

        /* column separator (subtle) */
        if (i > 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(toX(i) - COL_W / 2, PAD.top); ctx.lineTo(toX(i) - COL_W / 2, PAD.top + chartH); ctx.stroke();
        }

        /* dot */
        ctx.beginPath(); ctx.arc(x, y, isNow ? 5.5 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = isNow ? '#fff' : '#ff8a65';
        ctx.fill();
        ctx.strokeStyle = isNow ? '#ff8a65' : 'rgba(4,9,22,.85)';
        ctx.lineWidth = isNow ? 2.5 : 1.8; ctx.stroke();

        /* temperature label above dot */
        ctx.fillStyle = isNow ? '#fff' : 'rgba(232,244,253,0.82)';
        ctx.font = isNow ? `bold 13px 'Syne',sans-serif` : `11px 'Syne',sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(e.main.temp) + '°', x, y - 12);

        /* weather icon */
        ctx.font = '18px serif';
        ctx.fillText(wico(e.weather[0].icon), x, PAD.top + chartH + 20);

        /* time label */
        const d = new Date(e.dt * 1000);
        const tl = isNow ? 'Now' : d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(' ', '').toLowerCase();
        ctx.fillStyle = isNow ? 'rgba(79,195,247,0.9)' : 'rgba(232,244,253,0.4)';
        ctx.font = isNow ? `bold 9px 'Syne',sans-serif` : `9px 'DM Sans',sans-serif`;
        ctx.fillText(tl, x, PAD.top + chartH + 40);

        /* date label when day changes */
        if (i > 0) {
            const prev = new Date(entries[i - 1].dt * 1000);
            if (d.getDate() !== prev.getDate()) {
                const dl = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                ctx.fillStyle = 'rgba(79,195,247,0.5)';
                ctx.font = `8px 'DM Sans',sans-serif`; ctx.textAlign = 'center';
                ctx.fillText(dl, x, PAD.top + chartH + 56);
                /* day divider */
                ctx.strokeStyle = 'rgba(79,195,247,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.moveTo(toX(i) - COL_W / 2, PAD.top - 4); ctx.lineTo(toX(i) - COL_W / 2, PAD.top + chartH + 5); ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    });

    /* ── store metadata for tooltip ── */
    canvas._gg = { toX, toY, entries, COL_W, PAD, n, H };
    canvas.onmousemove = e => ggHover(e, canvas);
    canvas.onmouseleave = () => { document.getElementById('ggTip').style.opacity = '0'; };
    canvas.ontouchmove = e => { e.preventDefault(); ggHover(e.touches[0], canvas); };
}

function ggHover(e, canvas) {
    const m = canvas._gg; if (!m) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(m.n - 1, Math.round((mx - m.PAD.left - m.COL_W / 2) / m.COL_W)));
    const entry = m.entries[idx];
    const tip = document.getElementById('ggTip');
    const d = new Date(entry.dt * 1000);
    const tl = idx === 0 ? 'Now' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('ttTime').textContent = tl;
    document.getElementById('ttTemp').textContent = Math.round(entry.main.temp) + (unit === 'metric' ? '°C' : '°F');
    document.getElementById('ttCond').textContent = entry.weather[0].description;
    const pop = Math.round((entry.pop || 0) * 100);
    document.getElementById('ttRain').textContent = pop > 0 ? `💧 Rain: ${pop}%` : '';

    const tx = m.toX(idx);
    const ty = m.toY(entry.main.temp);
    const tipW = 160, tipH = 90;
    let lx = tx + 14, ly = ty - tipH / 2;
    const canvW = canvas.offsetWidth;
    if (lx + tipW > canvW - 10) lx = tx - tipW - 14;
    if (ly < 4) ly = 4;
    tip.style.left = lx + 'px';
    tip.style.top = ly + 'px';
    tip.style.opacity = '1';
}

/* drag-to-scroll */
function enableGGDrag() {
    const el = document.getElementById('ggScroll');
    if (!el) return;
    let isDown = false, startX = 0, scrollLeft = 0;
    el.addEventListener('mousedown', e => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; });
    el.addEventListener('mouseleave', () => isDown = false);
    el.addEventListener('mouseup', () => isDown = false);
    el.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX); });
}

window.addEventListener('resize', () => { if (hourlyData) drawGG(activeGGDays); });