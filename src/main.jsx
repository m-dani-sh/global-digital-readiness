import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Plot from "react-plotly.js";
import "./style.css";

const API = "https://api.worldbank.org/v2";
const START = 2000, END = 2024;
const INDICATORS = {
  gdp_per_capita: { code: "NY.GDP.PCAP.CD", label: "GDP per capita", unit: "current US$", description: "Economic output per person, expressed in current US dollars." },
  population: { code: "SP.POP.TOTL", label: "Population", unit: "people", description: "Total population of each economy." },
  internet_users: { code: "IT.NET.USER.ZS", label: "Internet users", unit: "%", description: "Share of the population using the Internet." },
  fixed_broadband: { code: "IT.NET.BBND.P2", label: "Fixed broadband", unit: "per 100 people", description: "Fixed broadband subscriptions per 100 people." },
  electricity_access: { code: "EG.ELC.ACCS.ZS", label: "Electricity access", unit: "%", description: "Share of the population with access to electricity." }
};
const COLAB_URL = import.meta.env.VITE_COLAB_NOTEBOOK_URL || "";
const NOTEBOOK_PATH = "/notebooks/Global_Digital_Readiness_World_Bank.ipynb";

async function fetchIndicator(key, meta) {
  const url = `${API}/country/all/indicator/${meta.code}?format=json&per_page=20000&date=${START}:${END}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API returned ${res.status} for ${meta.code}`);
  const payload = await res.json();
  if (!Array.isArray(payload) || !payload[1]) return [];
  return payload[1].filter(d => d.countryiso3code && d.region?.id !== "NA").map(d => ({
    iso3: d.countryiso3code, country: d.country?.value, year: Number(d.date), [key]: d.value == null ? null : Number(d.value)
  }));
}
function mergeRows(frames) {
  const map = new Map();
  frames.forEach(rows => rows.forEach(row => {
    const k = `${row.iso3}-${row.year}`;
    if (!map.has(k)) map.set(k, { ...row });
    else Object.assign(map.get(k), row);
  }));
  return [...map.values()].sort((a, b) => a.country?.localeCompare(b.country) || a.year - b.year);
}
function latestBy(rows, key) {
  const valid = rows.filter(r => r[key] != null).sort((a, b) => a.year - b.year);
  const m = new Map(); valid.forEach(r => m.set(r.iso3, r));
  return [...m.values()];
}
const fmt = (v, digits = 1) => v == null ? "—" : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
const layoutBase = { paper_bgcolor: "#ffffff", plot_bgcolor: "#ffffff", font: { family: "Inter, ui-sans-serif, system-ui", color: "#23334a" }, margin: { l: 58, r: 24, t: 58, b: 55 }, hoverlabel: { bgcolor: "#102b46", font: { color: "#fff" } } };
const config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] };

function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState("overview");
  const [country, setCountry] = useState("PAK");
  const [yearRange, setYearRange] = useState(2000);
  const [search, setSearch] = useState("");
  const [selectedCountries, setSelectedCountries] = useState(["USA", "CHN", "IND", "PAK", "BRA", "ZAF", "DEU", "JPN"]);

  useEffect(() => {
    let live = true;
    Promise.all(Object.entries(INDICATORS).map(([k, v]) => fetchIndicator(k, v)))
      .then(frames => { if (live) { setRows(mergeRows(frames)); setLoading(false); } })
      .catch(e => { if (live) { setError(e.message); setLoading(false); } });
    return () => { live = false; };
  }, []);

  const latest = useMemo(() => Object.fromEntries(Object.keys(INDICATORS).map(k => [k, latestBy(rows, k)])), [rows]);
  const profiles = useMemo(() => {
    const by = new Map();
    Object.entries(latest).forEach(([key, list]) => list.forEach(r => {
      if (!by.has(r.iso3)) by.set(r.iso3, { iso3: r.iso3, country: r.country });
      by.get(r.iso3)[key] = r[key]; by.get(r.iso3)[`${key}_year`] = r.year;
    }));
    return [...by.values()];
  }, [latest]);
  const countries = useMemo(() => [...new Map(rows.map(r => [r.iso3, { iso3: r.iso3, country: r.country }])).values()].sort((a, b) => a.country.localeCompare(b.country)), [rows]);
  const current = profiles.find(p => p.iso3 === country);
  const countryName = current?.country || "Selected country";
  const filteredCountries = countries.filter(c => c.country.toLowerCase().includes(search.toLowerCase()));
  const trendRows = rows.filter(r => selectedCountries.includes(r.iso3) && r.year >= yearRange && r.internet_users != null);
  const topInternet = [...latest.internet_users].sort((a, b) => b.internet_users - a.internet_users).slice(0, 12);
  const scatter = profiles.filter(p => p.gdp_per_capita != null && p.internet_users != null);
  const mapData = latest.internet_users;

  const nav = [
    ["overview", "Overview"], ["map", "Connectivity map"], ["economy", "Economy & access"], ["trends", "Country trends"], ["compare", "Compare countries"]
  ];
  const chart = (title, subtitle, child, wide = false) => (
    <section className={`chart-card ${wide ? "wide" : ""}`}>
      <div className="chart-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><span className="chart-mark">DATA</span></div>
      {child}
    </section>
  );
  const plot = (data, layout, style = {}) => <Plot data={data} layout={{ ...layoutBase, ...layout, autosize: true }} config={config} useResizeHandler style={{ width: "100%", height: style.height || "420px" }} />;

  if (loading) return <div className="loading-screen"><div className="brand-mark">G</div><h1>Preparing the data observatory</h1><p>Retrieving country indicators from the World Bank API…</p><div className="loader"></div></div>;
  if (error) return <div className="loading-screen"><h1>We couldn't load the live data</h1><p>{error}</p><p>Check your connection and refresh. The notebook includes the same API retrieval steps.</p><button onClick={() => location.reload()}>Retry</button></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">G</div><div><strong>Global Readiness</strong><small>DATA OBSERVATORY</small></div></div>
      <div className="side-label">EXPLORE</div>
      <nav>{nav.map(([id, label], i) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><span className="nav-num">0{i + 1}</span>{label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="source-mini"><span className="live-dot"></span><div><b>Live data connection</b><small>World Bank Indicators API</small></div></div><a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">World Bank Data ↗</a></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">RESEARCH / <b>{nav.find(n => n[0] === section)?.[1].toUpperCase()}</b></div><div className="top-actions"><span className="api-status"><i /> API connected</span><a className="notebook-link" href={NOTEBOOK_PATH} download="Global_Digital_Readiness_World_Bank.ipynb"> <span>⬇</span> Download Notebook & Source Code</a></div></header>
      <div className="content">
        <section className="hero">
          <div className="eyebrow"><span></span> WORLD BANK OPEN DATA · 2000–2024</div>
          <h1>Mapping the world's<br /><em>digital readiness.</em></h1>
          <p className="hero-copy">Explore how economic scale, connectivity and essential infrastructure shape countries' ability to participate in the digital economy.</p>
          <div className="hero-meta"><span>LIVE INDICATORS</span><b>05</b><span className="meta-divider"></span><span>COUNTRIES & ECONOMIES</span><b>{countries.length.toLocaleString()}</b><span className="meta-divider"></span><span>OBSERVATION WINDOW</span><b>{START}—{END}</b></div>
        </section>
        <div className="notice"><b>Research note</b><span>These indicators measure economic and digital infrastructure conditions. They are context for AI development, not direct measures of AI capability or adoption.</span></div>
        {section === "overview" && <>
          <div className="section-title"><div><span>01 / THE BIG PICTURE</span><h2>A connected world, unevenly.</h2></div><p>Latest available observation for each indicator. Reporting years can differ.</p></div>
          <div className="metric-grid">
            {[
              ["Economies covered", countries.length.toLocaleString(), "Country-level observations"],
              ["Internet use records", latest.internet_users.length.toLocaleString(), "Latest reported country values"],
              ["GDP records", latest.gdp_per_capita.length.toLocaleString(), "Latest reported country values"],
              ["Population records", latest.population.length.toLocaleString(), "Latest reported country values"]
            ].map(([a, b, c]) => <div className="metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}
          </div>
          <div className="chart-grid">
            {chart("Global internet access", "Latest reported share of population using the Internet.", plot([{ type: "choropleth", locations: mapData.map(d => d.iso3), z: mapData.map(d => d.internet_users), text: mapData.map(d => d.country), customdata: mapData.map(d => d.year), colorscale: [[0, "#e8f2f6"], [.5, "#73b9bd"], [1, "#145b85"]], zmin: 0, zmax: 100, colorbar: { title: "Internet<br>users (%)" }, hovertemplate: "%{text}<br>Internet users: %{z:.1f}%<br>Reported year: %{customdata}<extra></extra>" }], { geo: { showframe: false, showcoastlines: false, projection: { type: "natural earth" }, bgcolor: "#fff" }, height: 440 }, { height: "440px" }), true)}
            {chart("Income and internet use", "Explore the relationship between income per person and connectivity.", plot([{ type: "scatter", mode: "markers", x: scatter.map(d => d.gdp_per_capita), y: scatter.map(d => d.internet_users), text: scatter.map(d => d.country), customdata: scatter.map(d => [d.population, d.gdp_per_capita_year, d.internet_users_year]), marker: { size: scatter.map(d => Math.max(7, Math.min(26, Math.sqrt((d.population || 0) / 1e6)))), color: scatter.map(d => d.internet_users), colorscale: "Teal", showscale: true, colorbar: { title: "Internet<br>users (%)" }, opacity: .78, line: { color: "#fff", width: 1 } }, hovertemplate: "%{text}<br>GDP per capita: $%{x:,.0f}<br>Internet users: %{y:.1f}%<br>Population: %{customdata[0]:,.0f}<br>GDP year: %{customdata[1]} · Internet year: %{customdata[2]}<extra></extra>" }], { xaxis: { type: "log", title: "GDP per capita (current US$, log scale)", gridcolor: "#edf1f4" }, yaxis: { title: "Internet users (%)", range: [0, 100], gridcolor: "#edf1f4" }, height: 440 }), true)}
          </div>
          <div className="insight-strip"><div className="insight-icon">✳</div><div><b>Look beyond the headline</b><p>A high national average can hide gaps in access between urban and rural communities, income groups and regions. Country-level indicators are a starting point, not the whole story.</p></div></div>
        </>}
        {section === "map" && <>
          <div className="section-title"><div><span>02 / GEOGRAPHY</span><h2>Where connectivity reaches.</h2></div><p>Country-level internet use, latest available reporting year.</p></div>
          {chart("Internet use across countries", "Select or hover over a country to inspect its latest reported value.", plot([{ type: "choropleth", locations: mapData.map(d => d.iso3), z: mapData.map(d => d.internet_users), text: mapData.map(d => d.country), customdata: mapData.map(d => d.year), colorscale: [[0, "#e8f2f6"], [.5, "#73b9bd"], [1, "#145b85"]], zmin: 0, zmax: 100, colorbar: { title: "Internet users (%)" }, hovertemplate: "%{text}<br>%{z:.1f}%<br>Year: %{customdata}<extra></extra>" }], { geo: { showframe: false, showcoastlines: false, projection: { type: "natural earth" } }, height: 590 }), true)}
          {chart("Highest reported internet use", "Top 12 countries by latest reported internet-use share.", plot([{ type: "bar", x: topInternet.map(d => d.internet_users), y: topInternet.map(d => d.country), orientation: "h", marker: { color: "#278b91" }, customdata: topInternet.map(d => d.year), hovertemplate: "%{y}<br>%{x:.1f}%<br>Year: %{customdata}<extra></extra>" }], { xaxis: { title: "Internet users (%)", range: [0, 105] }, yaxis: { autorange: "reversed" }, height: 420 }), true)}
        </>}
        {section === "economy" && <>
          <div className="section-title"><div><span>03 / ECONOMIC CONTEXT</span><h2>Income, scale & access.</h2></div><p>Explore the relationship between national economic indicators and connectivity.</p></div>
          <div className="control-row"><label>Find a country <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…" /></label><label>Selected country <select value={country} onChange={e => setCountry(e.target.value)}>{filteredCountries.map(c => <option key={c.iso3} value={c.iso3}>{c.country}</option>)}</select></label></div>
          <div className="country-focus"><div><span>COUNTRY PROFILE</span><h3>{countryName}</h3></div><div className="profile-stats">{[["GDP per capita", current?.gdp_per_capita == null ? "—" : "$" + fmt(current.gdp_per_capita, 0)], ["Internet users", current?.internet_users == null ? "—" : fmt(current.internet_users) + "%"], ["Population", fmt(current?.population, 0)], ["Electricity access", current?.electricity_access == null ? "—" : fmt(current.electricity_access) + "%"]].map(([a, b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</div></div>
          {chart("Economic scale and connectivity", "Each point is a country. Bubble size represents population.", plot([{ type: "scatter", mode: "markers", x: scatter.map(d => d.gdp_per_capita), y: scatter.map(d => d.internet_users), text: scatter.map(d => d.country), marker: { size: scatter.map(d => Math.max(7, Math.min(28, Math.sqrt((d.population || 0) / 1e6)))), color: "#278b91", opacity: .68, line: { color: "#fff", width: 1 } }, hovertemplate: "%{text}<br>GDP per capita: $%{x:,.0f}<br>Internet users: %{y:.1f}%<extra></extra>" }], { xaxis: { type: "log", title: "GDP per capita (current US$, log scale)" }, yaxis: { title: "Internet users (%)", range: [0, 100] }, height: 500 }), true)}
          {chart("Population, GDP & Internet Use — Bubble Chart", "Bubble size = population · Colour = electricity access (%). Four dimensions of digital readiness in one view.", plot([{ type: "scatter", mode: "markers", x: scatter.map(d => d.gdp_per_capita), y: scatter.map(d => d.internet_users), text: scatter.map(d => d.country), customdata: scatter.map(d => [d.population, d.electricity_access != null ? d.electricity_access.toFixed(1) : "N/A"]), marker: { size: scatter.map(d => Math.max(9, Math.min(60, Math.sqrt((d.population || 0) / 1e6) * 2.8))), color: scatter.map(d => d.electricity_access ?? 0), colorscale: [[0, "#ffe0a0"], [0.5, "#278b91"], [1, "#102b46"]], showscale: true, colorbar: { title: "Electricity<br>access (%)", ticksuffix: "%" }, opacity: 0.76, line: { color: "#fff", width: 1.5 } }, hovertemplate: "%{text}<br>GDP per capita: $%{x:,.0f}<br>Internet users: %{y:.1f}%<br>Population: %{customdata[0]:,.0f}<br>Electricity access: %{customdata[1]}%<extra></extra>" }], { xaxis: { type: "log", title: "GDP per capita (current US$, log scale)", gridcolor: "#edf1f4" }, yaxis: { title: "Internet users (%)", range: [0, 100], gridcolor: "#edf1f4" }, height: 560 }), true)}
        </>}
        {section === "trends" && <>
          <div className="section-title"><div><span>04 / TIME SERIES</span><h2>Connectivity, year by year.</h2></div><p>Track reported internet-use percentages over time. Gaps are not filled or invented.</p></div>
          <div className="control-row"><label>Start year <select value={yearRange} onChange={e => setYearRange(Number(e.target.value))}>{Array.from({ length: END - START + 1 }, (_, i) => START + i).map(y => <option key={y}>{y}</option>)}</select></label><span className="helper-text">Choose countries in the comparison section to update the trend.</span></div>
          {chart("Internet use over time", "Selected economies · reported annual values.", plot(selectedCountries.map((iso, i) => ({ type: "scatter", mode: "lines+markers", name: countries.find(c => c.iso3 === iso)?.country || iso, x: trendRows.filter(r => r.iso3 === iso).map(r => r.year), y: trendRows.filter(r => r.iso3 === iso).map(r => r.internet_users), line: { width: 2.5 }, connectgaps: false })), { xaxis: { title: "Year", dtick: 2 }, yaxis: { title: "Internet users (%)", range: [0, 100] }, hovermode: "x unified", height: 510 }), true)}
          <div className="insight-strip"><div className="insight-icon">↗</div><div><b>Reading the trend</b><p>Compare the pace and timing of changes. Countries may have different reporting gaps, and the latest year may differ by country.</p></div></div>
        </>}
        {section === "compare" && <>
          <div className="section-title"><div><span>05 / COUNTRY COMPARISON</span><h2>Put countries side by side.</h2></div><p>Choose up to eight economies to compare the same set of indicators.</p></div>
          <div className="country-picker">{countries.filter(c => ["USA", "CHN", "IND", "PAK", "BRA", "ZAF", "DEU", "JPN", "GBR", "IDN", "NGA", "KEN", "BGD", "KOR", "AUS"].includes(c.iso3)).map(c => <label key={c.iso3} className={selectedCountries.includes(c.iso3) ? "picked" : ""}><input type="checkbox" checked={selectedCountries.includes(c.iso3)} onChange={e => setSelectedCountries(old => e.target.checked ? (old.length < 8 ? [...old, c.iso3] : old) : old.filter(x => x !== c.iso3))} />{c.country}</label>)}</div>
          {chart("Internet use comparison", "Latest reported percentage for selected countries.", plot(latest.internet_users.filter(d => selectedCountries.includes(d.iso3)).map(d => ({ type: "bar", name: d.country, x: [d.country], y: [d.internet_users], marker: { color: "#278b91" }, customdata: [[d.year]], hovertemplate: "%{x}<br>%{y:.1f}%<br>Year: %{customdata[0]}<extra></extra>" })), { barmode: "group", yaxis: { title: "Internet users (%)", range: [0, 100] }, showlegend: false, height: 430 }), true)}
          {chart("Infrastructure indicators", "Separate panels retain each indicator's native unit.", plot([{ type: "bar", name: "Internet users (%)", x: profiles.filter(p => selectedCountries.includes(p.iso3) && p.internet_users != null).map(p => p.country), y: profiles.filter(p => selectedCountries.includes(p.iso3) && p.internet_users != null).map(p => p.internet_users), xaxis: "x", yaxis: "y", marker: { color: "#278b91" } }, { type: "bar", name: "Fixed broadband per 100 people", x: profiles.filter(p => selectedCountries.includes(p.iso3) && p.fixed_broadband != null).map(p => p.country), y: profiles.filter(p => selectedCountries.includes(p.iso3) && p.fixed_broadband != null).map(p => p.fixed_broadband), xaxis: "x2", yaxis: "y2", marker: { color: "#e4a45d" } }, { type: "bar", name: "Electricity access (%)", x: profiles.filter(p => selectedCountries.includes(p.iso3) && p.electricity_access != null).map(p => p.country), y: profiles.filter(p => selectedCountries.includes(p.iso3) && p.electricity_access != null).map(p => p.electricity_access), xaxis: "x3", yaxis: "y3", marker: { color: "#5c82b5" } }], { grid: { rows: 3, columns: 1, pattern: "independent" }, xaxis: { title: "Internet users (%)" }, xaxis2: { title: "Fixed broadband per 100 people" }, xaxis3: { title: "Electricity access (%)" }, height: 760, showlegend: false }), true)}
        </>}
        <footer className="footer"><div><b>GLOBAL DIGITAL READINESS</b><span>Research experience powered by World Bank Open Data.</span></div><div className="footer-links"><a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">World Bank source ↗</a><a href={NOTEBOOK_PATH} download="Global_Digital_Readiness_World_Bank.ipynb">Notebook & code ⬇</a></div><small>Country-level indicators are not direct measures of AI capability or adoption. Latest available values may refer to different years.</small></footer>
      </div>
    </main>
  </div>
}
createRoot(document.getElementById("root")).render(<App />);
