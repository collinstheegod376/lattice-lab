

## Site Pages & Architecture

All pages have been faithfully replicated 1:1, inverted to the clean light/white theme with vibrant yellow accents and Lattice Lab branding:

| Route | Page | Description |
|---|---|---|
| `/` | `index.html` | **Homepage**: Hero superlattice visualizer, Current Program (`LATTICE-01`), 6 interactive computational figures, 15-page paper carousel, validation milestones, pipeline tracker, agent summary, and live terminal stream. |
| `/lab` | `lab.html` | **Virtual Lab**: Interactive floor plan blueprint featuring all 7 agent workstations (`LAB-01` through `LAB-07`), live agent inspection drawers, real-time status badges, pipeline flow, and console logs. |
| `/research` | `research.html` | **Research Projects**: Active exploration programs roster, candidate/artifact summary counters, and links to research dossiers. |
| `/research/lattice-01` | `research-detail.html` | **Project Dossier**: Detailed materials exploration dossier containing candidate screening table (`LAT-000` to `LAT-005`), foundational paper bibliography, and task lifecycle tracking. |
| `/archive` | `archive.html` | **Research Archive**: Full searchable and filterable database of 31+ research artifacts, papers, hypotheses, simulations, and validation certificates with search query and multi-parameter filters. |
| `/agents` | `agents.html` | **Researchers Directory**: Comprehensive profile cards for all 7 autonomous agents with customized animated SVG avatars, roles, system prompts, core imperatives, and output counters. |
| `/operator` | `operator.html` | **Operator Command Center**: Passphrase-protected interface (`lattice-operator`) with cluster telemetry, manual pipeline intervention controls, and candidate injection queue. |

---

## Quick Start

### 1. Run the Backend & Frontend
Ensure Node.js is installed, then run:

```bash
# Start the server (default port: 3000)
node server.js
```

Then visit:
```
http://localhost:3000
```

### 2. Standalone Frontend (No Backend Required)
You can also open `index.html` directly in any web browser (`file:///path/to/index.html`). The frontend includes a client-side daemon simulator that activates if the backend server is not connected.

---

## Features & Structure

- **Navigation & Brand:**
  - Responsive header with **Lattice Lab** geometric crystal icon.
  - Links to `HOME`, `LAB`, `RESEARCH`, `ARCHIVE`, `AGENTS`, `OPERATOR`, and scholarly badges (arXiv, GitHub, X).
- **Hero Superlattice Visualizer:**
  - High-fidelity 2D graphene-potassium superlattice diagram (`P6/m` symmetry) with interactive potassium dopant sites and electron-phonon HUD metrics.
- **Current Program (`LATTICE-01`):**
  - Interactive computational figures viewer (Figures 1–6: Supercell, Band structure & DOS, Eliashberg $\alpha^2F(\omega)$, Gap function $\Delta(\omega)$, BKT stiffness transition, and $\chi_0(q)$ susceptibility map).
  - Four key metric cards: $\lambda \approx 3.8$, $\omega_{\log} \approx 1650\text{ K}$, $T_c \approx 310\text{ K}$, $T_{\text{BKT}} \approx 120\text{ K}$.
- **Paper Viewer:**
  - Interactive multi-page carousel (pages 1 to 15) with previous/next navigation and PDF export links.
- **Researchers Roster & Pipeline Flow:**
  - 7 specialized autonomous agents: `LAB-01 DIRECTOR`, `LAB-02 LITERATURE`, `LAB-03 HYPOTHESIS`, `LAB-04 MATERIALS`, `LAB-05 SIMULATION`, `LAB-06 CRITIC`, `LAB-07 ARCHIVE`.
  - Live pipeline tracker (`RESEARCH → HYPOTHESIS → CANDIDATE → SIMULATION → CRITIQUE → VALIDATION → ARCHIVE`).
- **Live Terminal & Operator Console:**
  - Live Server-Sent Events (SSE) terminal streaming background research events.
  - Passphrase-protected Operator Modal (demo passphrase: `lattice-operator`) to manually step the pipeline or inject candidates.

---

## Backend API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/events` | `GET` (SSE) | Real-time Server-Sent Events stream for agent simulation ticks |
| `/api/status` | `GET` | Cluster status, active agents, and pipeline state |
| `/api/agents` | `GET` | List of 7 autonomous agents with current statuses |
| `/api/research` | `GET` | Current research program details and parameters |
| `/api/archive` | `GET` | Memory log of computational validation artifacts |
| `/api/paper/:page` | `GET` | Metadata and contents for paper viewer pages |
| `/api/operator/auth` | `POST` | Operator authentication (`lattice-operator`) |
| `/api/operator/step` | `POST` | Manually advance the multi-agent pipeline stage |
| `/api/operator/candidate` | `POST` | Inject a new material candidate into the pipeline |
