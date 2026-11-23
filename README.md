# Global Digital Readiness
### An Interactive Data Visualization Project

**Course:** Data Visualization  
**Project Type:** University Group Assignment  
**Institution:** Sir Syed University  
**Instructor:** Sir Anand

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Objectives](#2-project-objectives)
3. [Data Source](#3-data-source)
4. [Indicators Used](#4-indicators-used)
5. [Visualizations](#5-visualizations)
6. [Project Structure](#6-project-structure)
7. [Getting Started](#7-getting-started)
8. [Running the Notebook](#8-running-the-notebook)
9. [Methodological Notes](#9-methodological-notes)
10. [Tech Stack](#10-tech-stack)

---

## 1. Project Overview

Global Digital Readiness is an interactive data visualization project that explores how economic conditions and digital infrastructure relate to internet access around the world.

The project uses real-world statistics from **World Bank Open Data**. It presents the data through an interactive website and a Jupyter Notebook so users can explore patterns, compare countries, and understand changes over time.

The project is designed to make data exploration engaging and accessible. Rather than presenting charts as static images, the website allows users to interact with visualizations and inspect the underlying information.

> **Scope note:** This project investigates economic and infrastructure conditions related to digital readiness. It does not directly measure a country's AI capability, AI adoption, or AI research output.

---

## 2. Project Objectives

- Use a credible public data source to explore global digital readiness.
- Apply data cleaning and preparation techniques to real-world data.
- Create clear, interactive visualizations for comparing countries and trends.
- Explore relationships between economic indicators and digital connectivity.
- Provide a Jupyter Notebook containing the analysis and visualizations alongside the website.
- Communicate findings responsibly, including data gaps and limitations.

---

## 3. Data Source

The project uses **World Bank Open Data**, accessed through the World Bank Indicators API.

- Website: https://data.worldbank.org/
- API documentation: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589
- API base endpoint: https://api.worldbank.org/v2/

The World Bank provides country-level statistics covering topics such as economies, population, technology, infrastructure, health, and education.

The API returns structured data that can be processed in Python or JavaScript. The project uses the published values and retains their reporting years.

---

## 4. Indicators Used

| Indicator | What it represents | Unit |
|---|---|---|
| GDP per capita | Economic output per person; not an individual's salary | Current US dollars |
| Population, total | The total population of a country | People |
| Individuals using the Internet | Share of the population using the Internet | Percent |
| Fixed broadband subscriptions | Fixed broadband subscriptions relative to population | Subscriptions per 100 people |
| Access to electricity | Share of the population with access to electricity | Percent |

Indicator definitions and values are obtained from the World Bank. Reporting years may differ between indicators and countries because data availability is not uniform.

---

## 5. Visualizations

The website and notebook explore the data through the following visualization types:

| # | Chart Type | Description |
|---|---|---|
| 1 | **Choropleth map** | Shows how reported internet usage varies geographically across countries |
| 2 | **Ranked bar chart** | Compares countries with the highest reported internet-use values |
| 3 | **Scatter plot** | Explores the relationship between GDP per capita and internet usage |
| 4 | **Time-series line chart** | Shows how internet usage changes over time for selected countries |
| 5 | **Bubble chart** | Adds population as bubble size and electricity access as colour — four dimensions of digital readiness in one view |
| 6 | **Country comparison chart** | Compares internet usage, fixed broadband subscriptions, and electricity access side by side |

The web app is organised into five navigation sections:

```
01 / Overview          → Choropleth map + GDP vs Internet scatter plot
02 / Connectivity Map  → Full-screen internet-use map + top-12 ranked bar chart
03 / Economy & Access  → Country profile + scatter plot + bubble chart (Viz 5)
04 / Country Trends    → Internet-use time series for selected economies
05 / Compare Countries → Side-by-side bar charts for all indicators
```

---

## 6. Project Structure

```
global-digital-readiness/
├── public/
│   └── notebooks/
│       └── Global_Digital_Readiness_World_Bank.ipynb   # Served for browser download
├── notebooks/
│   └── Global_Digital_Readiness_World_Bank.ipynb       # Source notebook
├── src/
│   ├── main.jsx        # Main React application (all charts and logic)
│   └── style.css       # Application styles
├── index.html          # HTML entry point
├── package.json        # Node dependencies and scripts
├── .env.example        # Environment variable template
└── README.md           # This file
```

---

## 7. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open the local URL printed by Vite — typically `http://localhost:5173`.

### Production Build

```bash
npm run build      # Compiles and bundles into dist/
npm run preview    # Preview the production build locally
```

---

## 8. Running the Notebook

Open `notebooks/Global_Digital_Readiness_World_Bank.ipynb` in **Google Colab** or **Jupyter**.

Install required Python packages if they are not already available in your environment:

```bash
pip install pandas numpy requests plotly
```

Run all cells from top to bottom. The notebook fetches current observations directly from the World Bank API and renders all analytical charts.

> Clicking **"Download Notebook & Source Code"** in the website header will download the `.ipynb` file directly to your system.

---

## 9. Methodological Notes

- World Bank regional and income-group aggregates are **excluded** from country-level observations
- Missing values are **not** filled with zero — gaps appear as breaks in time-series charts
- Latest observations can be from **different years** for different countries; the reporting year is shown in hover tooltips
- GDP per capita is in **current US dollars** and is affected by exchange rates and inflation
- Fixed broadband subscriptions are **not** the same as unique individuals with internet access
- National averages can **conceal within-country inequalities** in access and infrastructure

---

## 10. Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | [React](https://react.dev/) |
| Build Tool | [Vite](https://vitejs.dev/) |
| Charts | [Plotly.js](https://plotly.com/javascript/) via [react-plotly.js](https://github.com/plotly/react-plotly.js) |
| Data Source | [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) |
| Notebook | Jupyter / Google Colab |

---

<div align="center">
  <sub>
    Sir Syed University · Data Visualization · Group Assignment<br>
    Data sourced from <a href="https://data.worldbank.org/">World Bank Open Data</a><br>
    Country-level indicators are not direct measures of AI capability or adoption.
  </sub>
</div>
