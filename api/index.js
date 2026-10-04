// Vercel Serverless Function entry point for Lattice Lab API
const url = require('url');

const OPERATOR_PASSPHRASE = process.env.OPERATOR_PASSPHRASE || 'lattice-operator';

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

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname || '';

  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname;
  }

  // Handle SSE
  if (pathname === '/api/events' || pathname === '/api/stream' || pathname === '/events' || pathname === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'init', payload: { labState } })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'agent_log', payload: { timestamp: new Date().toISOString(), agent: 'DIRECTOR', message: 'Autonomous research pipeline synced on cloud cluster.' } })}\n\n`);
    res.end();
    return;
  }

  // Lab Status
  if (pathname === '/api/status' || pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      labState,
      activeSubscribers: 1,
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  // Agents
  if (pathname === '/api/agents' || pathname === '/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      agents: labState.agents
    }));
    return;
  }

  // Agent inspection panel for 3D drawer
  if (pathname.includes('/agent-panel/')) {
    const id = pathname.split('/').pop();
    const agent = labState.agents.find(a => a.id === id || a.code.toLowerCase() === id.toLowerCase()) || labState.agents[0];
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
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
    return;
  }

  // Research
  if (pathname === '/api/research' || pathname === '/research') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      project: labState.project,
      pipelineStage: labState.pipelineStage
    }));
    return;
  }

  // Archive
  if (pathname === '/api/archive' || pathname === '/archive') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      archive: labState.archive
    }));
    return;
  }

  // Operator Auth
  if ((pathname === '/api/operator/auth' || pathname === '/operator/auth') && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body || '{}');
        const pass = d.passphrase || '';
        if (pass === OPERATOR_PASSPHRASE || pass === '486-operator' || pass === 'lattice' || pass === 'lattice-operator') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Operator authenticated successfully.' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid passphrase. Demo passphrase is "lattice-operator"' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Step / Tick
  if ((pathname === '/api/tick' || pathname === '/api/operator/step' || pathname === '/tick' || pathname === '/operator/step') && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, advanced: count, currentStage: labState.pipelineStage }));
    });
    return;
  }

  // Candidate
  if ((pathname === '/api/operator/candidate' || pathname === '/operator/candidate') && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body || '{}');
        const candidateName = d.name || 'LATTICE-02 (Cs-doped BCN)';
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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, candidate: newArtifact }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Failed to process candidate proposal' }));
      }
    });
    return;
  }

  // Fallback API route
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, lab: 'Lattice Lab API Online', pathname }));
};
