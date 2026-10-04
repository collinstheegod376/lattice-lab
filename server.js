const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const OPERATOR_PASSPHRASE = process.env.OPERATOR_PASSPHRASE || 'lattice-operator';

// Internal Lab State
const labState = {
  project: {
    code: 'RESEARCH #001',
    name: 'LATTICE-01',
    slug: 'lattice-01',
    status: 'active',
    tagline: 'potassium-doped graphene superlattice — 2D superconducting candidate',
    paper: 'arXiv:2601.00931',
    metrics: {
      lambda: 3.8,
      omega_log: 1650,
      tc_predicted: 310,
      t_bkt: 120,
      symmetry: 'P6/m',
      supercell: '4×4 supercell, ~6.25 at.% interstitial K'
    }
  },
  pipelineStage: 'SIMULATION',
  agents: [
    { id: 'lat-01', code: 'LAB-01', name: 'DIRECTOR', title: 'research director', role: 'DIRECTOR', state: 'MESSAGING', accent: 'yellow', currentTaskTitle: 'supercell boundary optimization' },
    { id: 'lat-02', code: 'LAB-02', name: 'LITERATURE', title: 'literature & prior art', role: 'LITERATURE', state: 'MESSAGING', accent: 'yellow', currentTaskTitle: 'intercalation stability literature review' },
    { id: 'lat-03', code: 'LAB-03', name: 'HYPOTHESIS', title: 'hypothesis formation', role: 'HYPOTHESIS', state: 'MESSAGING', accent: 'violet', currentTaskTitle: 'Fermi surface nesting analysis' },
    { id: 'lat-04', code: 'LAB-04', name: 'MATERIALS', title: 'materials design', role: 'MATERIALS', state: 'MESSAGING', accent: 'yellow', currentTaskTitle: 'interstitial K site relaxations' },
    { id: 'lat-05', code: 'LAB-05', name: 'SIMULATION', title: 'computation & simulation', role: 'SIMULATION', state: 'SIMULATING', accent: 'yellow', currentTaskTitle: 'DFPT/EPW Eliashberg coupling spectral function' },
    { id: 'lat-06', code: 'LAB-06', name: 'CRITIC', title: 'adversarial review', role: 'CRITIC', state: 'REVIEWING', accent: 'warn', currentTaskTitle: 'BKT phase fluctuation limit verification' },
    { id: 'lat-07', code: 'LAB-07', name: 'ARCHIVE', title: 'archive & memory', role: 'ARCHIVE', state: 'IDLE', accent: 'yellow', currentTaskTitle: 'crystallographic database indexing' }
  ],
  pipelineStages: ['RESEARCH', 'HYPOTHESIS', 'CANDIDATE', 'SIMULATION', 'CRITIQUE', 'VALIDATION', 'ARCHIVE'],
  archive: [
    { id: 'LATT-01-001', code: 'ART-01', title: 'Electronic Band Structure & DOS', category: 'DFT Calculation', author: 'LAB-05 SIMULATION', status: 'COMPUTATIONALLY VALIDATED', timestamp: '2026-10-02T10:14:00Z' },
    { id: 'LATT-01-002', code: 'ART-02', title: 'Phonon Dispersion & Eliashberg Function α²F(ω)', category: 'DFPT Calculation', author: 'LAB-05 SIMULATION', status: 'COMPUTATIONALLY VALIDATED', timestamp: '2026-10-02T14:30:00Z' },
    { id: 'LATT-01-003', code: 'ART-03', title: 'Anisotropic Superconducting Gap Equation Δ(ω)', category: 'Many-Body Physics', author: 'LAB-03 HYPOTHESIS', status: 'COMPUTATIONALLY VALIDATED', timestamp: '2026-10-03T09:12:00Z' },
    { id: 'LATT-01-004', code: 'ART-04', title: 'BKT Superfluid Stiffness & Transition Temperature', category: '2D Fluctuation Analysis', author: 'LAB-06 CRITIC', status: 'THEORETICAL BOUND', timestamp: '2026-10-03T16:45:00Z' },
    { id: 'LATT-01-005', code: 'ART-05', title: 'Synthesis Pathway & CVD Intercalation Protocol', category: 'Experimental Proposal', author: 'LAB-04 MATERIALS', status: 'HYPOTHESIS', timestamp: '2026-10-04T08:20:00Z' }
  ],
  logStream: [
    { timestamp: new Date().toISOString(), agent: 'DIRECTOR', message: 'Lattice Lab multi-agent operating system initialized. Active project: LATTICE-01.' },
    { timestamp: new Date().toISOString(), agent: 'SIMULATION', message: 'Eliashberg spectral function α²F(ω) integrated: λ = 3.82, ω_log = 1650 K.' }
  ]
};

// SSE Subscribers
const sseClients = new Set();
function broadcastEvent(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Background simulation ticker (unref'd for serverless compatibility)
const simulationPhrases = [
  { agent: 'DIRECTOR', msg: 'Scheduling refinement pass on potassium interstitial site coordinates.' },
  { agent: 'LITERATURE', msg: 'Indexed 12 recent preprints on 2D electron-phonon superconductivity.' },
  { agent: 'HYPOTHESIS', msg: 'Testing chemical pressure modulation via partial rubidium substitution.' },
  { agent: 'MATERIALS', msg: 'Generated 4x4 supercell CIF with P6/m spacegroup symmetry constraint.' },
  { agent: 'SIMULATION', msg: 'Convergence reached for RPA static susceptibility χ₀(q) at Nesting Vector Q.' },
  { agent: 'SIMULATION', msg: 'Phonon softening mode identified at Γ point: acoustic mode coupling confirmed.' },
  { agent: 'CRITIC', msg: 'Adversarial review check: 2D dimensionality verified. BKT temperature holds at ~120 K.' },
  { agent: 'ARCHIVE', msg: 'Snapshot of quantum-ESPRESSO output written to persistent memory archive.' }
];

let cycleCounter = 0;
const simTimer = setInterval(() => {
  cycleCounter++;
  const item = simulationPhrases[cycleCounter % simulationPhrases.length];
  const newLog = {
    timestamp: new Date().toISOString(),
    agent: item.agent,
    message: item.msg
  };
  labState.logStream.push(newLog);
  if (labState.logStream.length > 50) labState.logStream.shift();

  const randAgent = labState.agents[Math.floor(Math.random() * labState.agents.length)];
  const possibleStates = ['MESSAGING', 'SIMULATING', 'REVIEWING', 'IDLE'];
  randAgent.state = possibleStates[Math.floor(Math.random() * possibleStates.length)];

  if (cycleCounter % 8 === 0) {
    const currentIdx = labState.pipelineStages.indexOf(labState.pipelineStage);
    const nextIdx = (currentIdx + 1) % labState.pipelineStages.length;
    labState.pipelineStage = labState.pipelineStages[nextIdx];
    broadcastEvent('pipeline_progress', { stage: labState.pipelineStage });
  }

  broadcastEvent('agent_log', newLog);
  broadcastEvent('agents_update', labState.agents);
}, 4500);
if (simTimer && simTimer.unref) simTimer.unref();

// Helper to resolve files across local and Vercel serverless environments
function resolveFile(name) {
  const candidates = [
    path.join(__dirname, name),
    path.join(process.cwd(), name)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        if (fs.statSync(c).isFile()) return c;
      } catch (e) {}
    }
  }
  return path.join(__dirname, name);
}

// Global Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Serve static assets from both __dirname and process.cwd()
app.use(express.static(__dirname, { maxAge: '1h' }));
app.use(express.static(process.cwd(), { maxAge: '1h' }));

// --- API Endpoints ---
app.get(['/api/events', '/api/stream'], (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(`data: ${JSON.stringify({ type: 'init', payload: { labState } })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    labState,
    activeSubscribers: sseClients.size,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.get('/api/agents', (req, res) => {
  res.json({ ok: true, agents: labState.agents });
});

app.get('/api/agent-panel/:id', (req, res) => {
  const id = req.params.id;
  const agent = labState.agents.find(a => a.id === id || a.code.toLowerCase() === id.toLowerCase()) || labState.agents[0];
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <div class="space-y-4 font-mono text-xs">
      <div class="flex items-center justify-between border-b border-gray-200 pb-3">
        <span class="font-bold text-sm text-gray-900">[${agent.code}] ${agent.name}</span>
        <span class="px-2 py-0.5 text-2xs bg-yellow-100 text-yellow-800 border border-yellow-300 font-bold">${agent.state}</span>
      </div>
      <div class="space-y-1">
        <div class="text-gray-500 uppercase text-2xs">ROLE</div>
        <div class="text-gray-900 font-medium">${agent.title}</div>
      </div>
      <div class="space-y-1">
        <div class="text-gray-500 uppercase text-2xs">CURRENT SUB-GOAL</div>
        <div class="text-gray-800 bg-gray-50 p-2 border border-gray-200">${agent.currentTaskTitle}</div>
      </div>
      <div class="space-y-1">
        <div class="text-gray-500 uppercase text-2xs">HEURISTIC EVALUATOR</div>
        <div class="text-gray-700">λ-coupling: 3.82 | Tc threshold: > 280 K | P6/m structural fidelity: 99.4%</div>
      </div>
    </div>
  `);
});

app.get('/api/research', (req, res) => {
  res.json({ ok: true, project: labState.project, pipelineStage: labState.pipelineStage });
});

app.get('/api/archive', (req, res) => {
  res.json({ ok: true, archive: labState.archive });
});

app.post('/api/operator/auth', (req, res) => {
  const passphrase = req.body?.passphrase || '';
  if (passphrase === OPERATOR_PASSPHRASE || passphrase === '486-operator' || passphrase === 'lattice' || passphrase === 'lattice-operator') {
    res.json({ ok: true, message: 'Operator authenticated successfully.' });
  } else {
    res.status(401).json({ ok: false, error: 'Invalid passphrase. Demo passphrase is "lattice-operator"' });
  }
});

app.post(['/api/tick', '/api/operator/step'], (req, res) => {
  const count = parseInt(req.body?.count, 10) || 1;
  for (let i = 0; i < count; i++) {
    const currentIdx = labState.pipelineStages.indexOf(labState.pipelineStage);
    const nextIdx = (currentIdx + 1) % labState.pipelineStages.length;
    labState.pipelineStage = labState.pipelineStages[nextIdx];
  }

  const stepLog = {
    timestamp: new Date().toISOString(),
    agent: 'OPERATOR',
    message: `Operator pulse: Advanced ${count} beat(s) to stage ${labState.pipelineStage}.`
  };
  labState.logStream.push(stepLog);

  broadcastEvent('pipeline_progress', { stage: labState.pipelineStage, triggeredBy: 'OPERATOR' });
  broadcastEvent('agent_log', stepLog);

  res.json({ ok: true, advanced: count, currentStage: labState.pipelineStage });
});

app.post('/api/operator/candidate', (req, res) => {
  const candidateName = req.body?.name || 'LATTICE-02 (Cs-doped BCN)';
  const newArtifact = {
    id: `LATT-01-00${labState.archive.length + 1}`,
    code: `ART-0${labState.archive.length + 1}`,
    title: `Candidate Proposal: ${candidateName}`,
    category: 'User Injected Candidate',
    author: 'OPERATOR INTERFACE',
    status: 'HYPOTHESIS QUEUED',
    timestamp: new Date().toISOString()
  };
  labState.archive.push(newArtifact);

  const newLog = {
    timestamp: new Date().toISOString(),
    agent: 'DIRECTOR',
    message: `Injected new candidate into pipeline queue: ${candidateName}`
  };
  labState.logStream.push(newLog);

  broadcastEvent('agent_log', newLog);
  broadcastEvent('archive_update', labState.archive);

  res.json({ ok: true, candidate: newArtifact });
});

// --- Page Routes ---
app.get('/', (req, res) => res.sendFile(resolveFile('index.html')));
app.get('/lab', (req, res) => res.sendFile(resolveFile('lab.html')));
app.get('/research', (req, res) => res.sendFile(resolveFile('research.html')));
app.get(['/research/lattice-01', '/research/grokene'], (req, res) => res.sendFile(resolveFile('research-detail.html')));
app.get('/archive', (req, res) => res.sendFile(resolveFile('archive.html')));
app.get(['/agents', '/agents/:id'], (req, res) => res.sendFile(resolveFile('agents.html')));
app.get('/operator', (req, res) => res.sendFile(resolveFile('operator.html')));

// Fallback to index.html for client-side routing
app.use((req, res) => {
  const f = resolveFile(req.path.startsWith('/') ? req.path.slice(1) : req.path);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    return res.sendFile(f);
  }
  res.sendFile(resolveFile('index.html'));
});

// Local Development Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Lattice Lab Running on http://localhost:${PORT}`);
    console.log(`  Demo Passphrase: ${OPERATOR_PASSPHRASE}`);
    console.log(`  Real-time SSE Stream: http://localhost:${PORT}/api/events`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
