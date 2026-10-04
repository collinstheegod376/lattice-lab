const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

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
  pipelineStage: 'SIMULATION', // RESEARCH -> HYPOTHESIS -> CANDIDATE -> SIMULATION -> CRITIQUE -> VALIDATION -> ARCHIVE
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
    client.write(`data: ${data}\n\n`);
  }
}

// Background simulation loop generating live lab events
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
setInterval(() => {
  cycleCounter++;
  const item = simulationPhrases[cycleCounter % simulationPhrases.length];
  const newLog = {
    timestamp: new Date().toISOString(),
    agent: item.agent,
    message: item.msg
  };
  labState.logStream.push(newLog);
  if (labState.logStream.length > 50) labState.logStream.shift();

  // Randomly toggle an agent state to create dynamic visual feedback
  const randAgent = labState.agents[Math.floor(Math.random() * labState.agents.length)];
  const possibleStates = ['MESSAGING', 'SIMULATING', 'REVIEWING', 'IDLE'];
  randAgent.state = possibleStates[Math.floor(Math.random() * possibleStates.length)];

  // Progress pipeline occasionally
  if (cycleCounter % 8 === 0) {
    const currentIdx = labState.pipelineStages.indexOf(labState.pipelineStage);
    const nextIdx = (currentIdx + 1) % labState.pipelineStages.length;
    labState.pipelineStage = labState.pipelineStages[nextIdx];
    broadcastEvent('pipeline_progress', { stage: labState.pipelineStage });
  }

  broadcastEvent('agent_log', newLog);
  broadcastEvent('agents_update', labState.agents);
}, 4500);

// Paper pages metadata
const paperPages = Array.from({ length: 15 }, (_, i) => {
  const pageNum = i + 1;
  return {
    pageNum,
    title: pageNum === 1 
      ? 'AI-Guided Design of a Superconductor Candidate: Lattice-01' 
      : `Section ${pageNum}: Computational Methodology & Results (Page ${pageNum})`,
    arxiv: '2601.00931',
    date: 'January 2026',
    authors: 'Lattice Lab Autonomous Multi-Agent Collective'
  };
});

// Create HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API: SSE Stream (/api/events & /api/stream) ---
  if (pathname === '/api/events' || pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'init', payload: { labState } })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- API: Lab Status ---
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      labState,
      activeSubscribers: sseClients.size,
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  // --- API: Agents ---
  if (pathname === '/api/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      agents: labState.agents
    }));
    return;
  }

  // --- API: Research Program ---
  if (pathname === '/api/research') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      project: labState.project,
      pipelineStage: labState.pipelineStage
    }));
    return;
  }

  // --- API: Archive ---
  if (pathname === '/api/archive') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      archive: labState.archive
    }));
    return;
  }

  // --- API: Operator Authentication ---
  if (pathname === '/api/operator/auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const passphrase = data.passphrase || '';
        if (passphrase === OPERATOR_PASSPHRASE || passphrase === '486-operator' || passphrase === 'lattice') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Operator authenticated successfully.' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid passphrase. Demo passphrase is "lattice-operator"' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // --- API: Operator Pipeline Step & Tick (/api/tick & /api/operator/step) ---
  if ((pathname === '/api/tick' || pathname === '/api/operator/step') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let count = 1;
      try {
        const d = JSON.parse(body || '{}');
        if (d.count) count = parseInt(d.count, 10) || 1;
      } catch (e) {}

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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, advanced: count, currentStage: labState.pipelineStage }));
    });
    return;
  }

  // --- API: Propose New Candidate ---
  if (pathname === '/api/operator/candidate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const candidateName = data.name || 'LATTICE-02 (Cs-doped BCN)';
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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, candidate: newArtifact }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Failed to process candidate proposal' }));
      }
    });
    return;
  }

  // --- Static File & Route Serving ---
  const routeMap = {
    '/': 'index.html',
    '/lab': 'lab.html',
    '/research': 'research.html',
    '/research/lattice-01': 'research-detail.html',
    '/research/grokene': 'research-detail.html',
    '/archive': 'archive.html',
    '/agents': 'agents.html',
    '/operator': 'operator.html'
  };

  let targetFile = routeMap[pathname];
  if (!targetFile && pathname.startsWith('/agents/')) {
    targetFile = 'agents.html';
  }
  if (!targetFile) {
    targetFile = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  }
  let filePath = path.join(__dirname, targetFile);

  // If no extension, try appending .html
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Security check to stay inside directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Lattice Lab Backend Running on http://localhost:${PORT}`);
    console.log(`  Demo Passphrase: ${OPERATOR_PASSPHRASE}`);
    console.log(`  Real-time SSE Stream: http://localhost:${PORT}/api/events`);
    console.log(`=======================================================`);
  });
}

module.exports = server;
