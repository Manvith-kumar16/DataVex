# 🛡️ DataVex: Production-Grade AI Intelligence & Leads Engine

DataVex is a state-of-the-art, multi-agent AI orchestration platform designed for enterprise-grade lead intelligence and strategic analysis. It transforms raw domain data into deep, actionable insights using a distributed architecture.

---

## 🏗️ Architecture Overview

DataVex follows a modern **Client-Server Architecture** designed for security, scalability, and "SaaS-ready" deployment.

- **Frontend (UI Portal)**: A high-performance React application built with Vite, TailwindCSS, and Shadcn UI. It handles visualization and user interaction.
- **Backend (Intelligence Engine)**: A robust Node.js/Express server that isolates all AI logic, secret keys, and heavy orchestration from the client.

### 🛡️ Security & Isolation
- **API Key Protection**: All sensitive keys (Tavily, OpenAI) are strictly server-side.
- **Rate Limiting**: Built-in protection against API abuse.
- **Enterprise Isolation**: Dynamic "Mega-Enterprise" detection to prevent redundant outreach to companies with massive internal tech teams.

---

## 🤖 Multi-Agent Orchestration System

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



