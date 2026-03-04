# 🛡️ DataVex: Production-Grade AI Intelligence & Leads Engine

DataVex is a state-of-the-art, multi-agent AI orchestration platform designed for enterprise-grade lead intelligence and strategic analysis. It transforms raw domain data into deep, actionable insights using a distributed architecture.

---

## 🏗️ Architecture Overview

DataVex follows a modern **Client-Server Architecture** designed for security, scalability, and "SaaS-ready" deployment.

- **Frontend (UI Portal)**: A high-performance React application built with Vite, TailwindCSS, and Shadcn UI. It handles visualization and user interaction.
- **Backend (Intelligence Engine)**: A robust Node.js/Express server that isolates all AI logic, secret keys, and heavy orchestration from the client.

### 🛡️ Security & Isolation:
- **API Key Protection**: All sensitive keys (Tavily, OpenAI) are strictly server-side.
- **Rate Limiting**: Built-in protection against API abuse.
- **Enterprise Isolation**: Dynamic "Mega-Enterprise" detection to prevent redundant outreach to companies with massive internal tech teams.

---

## 🤖 Multi-Agent Orchestration System:

DataVex uses a collaborative multi-agent system to analyze domains. Each agent is a specialized specialist:

| Agent | Responsibility |
| :--- | :--- |
| **Research Agent** | Performs real-time web research via Tavily to collect live signals, hiring trends, and technical clues. |
| **Signal Agent** | Structures raw research data into categorized intelligence (Funding, Tech, Hiring, etc.). |
| **Technical Agent** | Maps signals to specific DataVex services using dynamic, evidence-based matching logic. |
| **Financial Agent** | Analyzes funding momentum and budget indicators to determine financial readiness. |
| **Market Agent** | Evaluates competitive landscape and industry pressure for modernization. |
| **Debate Agent** | Triggers a multi-agent "internal conflict" to challenge assumptions and reach a consensus. |
| **Verdict Agent** | Issues the final "Pursue", "Nurture", or "Skip" recommendation with high-confidence reasoning. |

---

## 🛠️ Environment Configuration

The system is split into two environments. Ensure you have the following `.env` files configured:

### Backend (`/server/.env`)
```env
PORT=3001
TAVILY_API_KEY=your_tavily_api_key_here
NODE_ENV=development
```

### Frontend (`./.env`)
```env
VITE_API_URL=http://localhost:3001
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm
- A Tavily API Key ([Get one here](https://tavily.com))

### 2. Installations
Run installations in both the root and server directories:

```bash
# Root (Frontend) dependencies
npm install

# Server (Backend) dependencies
cd server
npm install
```

### 3. Running the Platform
You need to run both the frontend and backend simultaneously:

**Terminal 1: Start Backend**
```bash
cd server
npm run dev
```

**Terminal 2: Start Frontend**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`, communicating with the API at `localhost:3001`.

---

## 📁 Repository Structure

```
DataVex/
├── index.html                        # HTML entry point for Vite
├── package.json                      # Frontend dependencies & scripts
├── vite.config.ts                    # Vite build configuration
├── vitest.config.ts                  # Vitest test configuration
├── tailwind.config.ts                # TailwindCSS configuration
├── tsconfig.json                     # Root TypeScript config
├── tsconfig.app.json                 # App-level TypeScript config
├── tsconfig.node.json                # Node-level TypeScript config
├── eslint.config.js                  # ESLint rules
├── postcss.config.js                 # PostCSS configuration
├── components.json                   # Shadcn UI component registry
│
├── public/                           # Static public assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/                              # Frontend source (React / TypeScript)
│   ├── main.tsx                      # Application bootstrap
│   ├── App.tsx                       # Root component & router setup
│   ├── index.css                     # Global styles
│   ├── vite-env.d.ts                 # Vite type declarations
│   │
│   ├── pages/                        # Route-level page components
│   │   ├── Index.tsx                 # Landing / home page
│   │   ├── Dashboard.tsx             # Main dashboard
│   │   ├── Analysis.tsx              # Domain analysis view
│   │   ├── Discover.tsx              # Company discovery
│   │   ├── Compare.tsx               # Side-by-side comparison
│   │   ├── History.tsx               # Analysis history
│   │   ├── Services.tsx              # Services overview
│   │   ├── Onboarding.tsx            # User onboarding flow
│   │   ├── Login.tsx                 # Authentication page
│   │   └── NotFound.tsx              # 404 page
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── CommandPalette.tsx        # Global keyboard command palette
│   │   ├── NavLink.tsx               # Navigation link wrapper
│   │   ├── analysis/                 # Analysis-specific components
│   │   │   ├── AgentAgreement.tsx
│   │   │   ├── AgentDebate.tsx
│   │   │   ├── ConfidenceEngine.tsx
│   │   │   ├── EvidenceSection.tsx
│   │   │   ├── ExplainableScoring.tsx
│   │   │   ├── OutreachTabs.tsx
│   │   │   ├── RiskOpportunityQuadrant.tsx
│   │   │   ├── ScenarioSimulator.tsx
│   │   │   └── ScoreGauge.tsx
│   │   ├── discover/                 # Company discovery components
│   │   │   ├── CompanyCard.tsx
│   │   │   ├── CompanyResults.tsx
│   │   │   └── LocationSearch.tsx
│   │   ├── layout/                   # Layout & navigation
│   │   │   └── Sidebar.tsx
│   │   ├── services/                 # Services page sections
│   │   │   ├── AboutSection.tsx
│   │   │   ├── CoreServicesSection.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   └── TechStackSection.tsx
│   │   └── ui/                       # Shadcn UI primitives (accordion, button, card, …)
│   │
│   ├── contexts/                     # React context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useDebounce.ts
│   │
│   ├── lib/                          # Frontend utilities & orchestration
│   │   ├── agents.ts                 # Agent definitions (current)
│   │   ├── agentsLegacy.ts           # Legacy agent definitions
│   │   ├── memoryStore.ts            # Client-side memory store
│   │   ├── orchestrator.ts           # Frontend orchestration logic
│   │   ├── pdfExport.ts              # PDF report export helper
│   │   ├── scenarioEngine.ts         # Scenario simulation engine
│   │   └── utils.ts                  # General-purpose utilities
│   │
│   ├── types/                        # Shared TypeScript type definitions
│   │   └── analysis.ts
│   │
│   └── test/                         # Frontend unit tests (Vitest)
│       ├── agents.test.ts
│       ├── alignmentIndex.test.ts
│       ├── confidenceEngine.test.ts
│       ├── example.test.ts
│       ├── memoryStore.test.ts
│       ├── orchestrator.test.ts
│       ├── scenarioEngine.test.ts
│       └── setup.ts
│
└── server/                           # Backend source (Node.js / Express / TypeScript)
    ├── package.json                  # Backend dependencies & scripts
    ├── tsconfig.json                 # Backend TypeScript config
    ├── vercel.json                   # Vercel deployment config
    └── src/
        ├── index.ts                  # Express server entry point
        ├── agents/                   # AI agent implementations
        │   ├── debateAgent.ts        # Multi-agent debate logic
        │   ├── financialAgent.ts     # Financial signal analysis
        │   ├── marketAgent.ts        # Market & competitive analysis
        │   ├── researchAgent.ts      # Real-time web research (Tavily)
        │   ├── signalAgent.ts        # Raw signal structuring
        │   ├── technicalAgent.ts     # Service-to-signal mapping
        │   └── verdictAgent.ts       # Final recommendation engine
        ├── lib/                      # Backend shared utilities
        │   ├── analysisCache.ts      # In-memory result caching
        │   ├── memoryStore.ts        # Server-side memory store
        │   ├── orchestrator.ts       # Agent pipeline orchestration
        │   └── utils.ts              # Backend utilities
        ├── memory/
        │   └── executionTrace.jsonl  # JSONL audit trail of analyses
        ├── routes/
        │   └── analyze.ts            # POST /analyze API route
        ├── scoring/
        │   └── enterpriseConstraint.ts  # Mega-enterprise detection & scoring
        ├── services/
        │   ├── enterpriseIsolation.ts   # Enterprise isolation logic
        │   ├── searchProvider.ts        # Tavily / search abstraction
        │   └── signalExtractor.ts       # Signal extraction from raw text
        └── types/
            └── analysis.ts           # Backend TypeScript types
```

---

## 🧬 Core Intelligence Features

- **Dynamic Scale Detection**: Real-time probing of company size and internal capability maturity.
- **Execution Memory**: JSONL-based audit trails of every analysis for full transparency.
- **Evidence Tags**: Every signal is attributed to its source with a reliability score.
- **Service Reasoning**: Automated "Why" explanations that cite specific technical signals discovered.

---

## 👥 Contributors

- **Manvith Kumar Ullal**
- **Shriraksha P Acharya**
- **Navami**



