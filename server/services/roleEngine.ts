import { NodeMetrics } from './graphEngine';

export interface PotentialRoleResult {
  primaryRole: string; // e.g. "Potential Organizer"
  confidence: number;
  supporting_indicators: string[];
  all_potential_roles: {
    role: string;
    score: number;
    description: string;
  }[];
}

export function inferPotentialRoles(
  entity: any,
  metrics?: NodeMetrics,
  connectedEdges: any[] = []
): PotentialRoleResult {
  const type = (entity.type || '').toUpperCase();
  const explicitRole = (entity.role || '').toLowerCase();
  const inDegree = metrics?.inDegree || 0;
  const outDegree = metrics?.outDegree || 0;
  const totalDegree = metrics?.totalDegree || 0;
  const betweenness = metrics?.betweennessCentrality || 0;
  const isBridge = metrics?.isBridgeCandidate || false;
  const crossCluster = metrics?.crossClusterEdges || 0;

  let totalInflow = 0;
  let totalOutflow = 0;
  let transferCount = 0;

  connectedEdges.forEach((edge) => {
    const val = Number(edge.value || 0);
    if (edge.target === entity.id) {
      totalInflow += val;
    }
    if (edge.source === entity.id) {
      totalOutflow += val;
    }
    if (edge.type === 'TRANSFERRED_TO' || edge.type === 'financial_transaction') {
      transferCount++;
    }
  });

  const candidates: { role: string; score: number; description: string; indicators: string[] }[] = [];

  // 1. Potential Organizer
  let organizerScore = 0;
  const orgIndicators: string[] = [];
  if (type === 'PERSON' && (explicitRole.includes('kingpin') || explicitRole.includes('organizer'))) {
    organizerScore += 45;
    orgIndicators.push('Identified subject with supervisory or key-signing control links');
  }
  if (betweenness > 0.15) {
    organizerScore += 25;
    orgIndicators.push(`High betweenness centrality (${betweenness.toFixed(3)})`);
  }
  if (outDegree >= 2 && inDegree >= 1) {
    organizerScore += 20;
    orgIndicators.push('Bidirectional command and asset distribution links');
  }
  if (organizerScore > 30) {
    candidates.push({
      role: 'Potential Organizer',
      score: Math.min(99, organizerScore),
      description: 'Coordinates core network infrastructure, commands operational directives, or controls key private treasury keys.',
      indicators: orgIndicators,
    });
  }

  // 2. Potential Bridge Node
  let bridgeScore = 0;
  const bridgeIndicators: string[] = [];
  if (isBridge) {
    bridgeScore += 40;
    bridgeIndicators.push('Topological graph articulation point (severing fragments network)');
  }
  if (crossCluster >= 2) {
    bridgeScore += 35;
    bridgeIndicators.push(`Connects ${crossCluster} distinct operational clusters`);
  }
  if (betweenness > 0.1) {
    bridgeScore += 20;
    bridgeIndicators.push(`Conduit for ${Math.round(betweenness * 100)}% of shortest communication/transaction paths`);
  }
  if (bridgeScore > 30) {
    candidates.push({
      role: 'Potential Bridge Node',
      score: Math.min(98, bridgeScore),
      description: 'Functions as a structural gateway bridging disparate functional subgraphs or technical platforms.',
      indicators: bridgeIndicators,
    });
  }

  // 3. Potential Funds Distributor
  let distributorScore = 0;
  const distIndicators: string[] = [];
  if (outDegree >= 3 && transferCount >= 2) {
    distributorScore += 35;
    distIndicators.push(`High fan-out transaction velocity (${outDegree} outbound links)`);
  }
  if (totalOutflow > 5000000) {
    distributorScore += 35;
    distIndicators.push(`Large-scale outgoing transaction disbursement ($${(totalOutflow / 1000000).toFixed(1)}M)`);
  }
  if (type === 'WALLET' && (explicitRole.includes('mixer') || explicitRole.includes('launderer'))) {
    distributorScore += 25;
    distIndicators.push('Mixer pooling or peeling-chain distribution behavior');
  }
  if (distributorScore > 30) {
    candidates.push({
      role: 'Potential Funds Distributor',
      score: Math.min(96, distributorScore),
      description: 'Disburses incoming treasury assets into multiple intermediate mule accounts or decentralized pools.',
      indicators: distIndicators,
    });
  }

  // 4. Potential Mule
  let muleScore = 0;
  const muleIndicators: string[] = [];
  if (explicitRole.includes('mule') || entity.name?.toLowerCase().includes('mule')) {
    muleScore += 50;
    muleIndicators.push('Smurfing or nominee holder behavior pattern');
  }
  if (inDegree >= 1 && outDegree >= 1 && totalInflow > 0 && Math.abs(totalInflow - totalOutflow) / (totalInflow || 1) < 0.25) {
    muleScore += 35;
    muleIndicators.push('Rapid pass-through fund flow with minimal balance retention (transit hop)');
  }
  if (type === 'WALLET' && totalInflow < 2000000 && totalInflow > 100000) {
    muleScore += 20;
    muleIndicators.push('Smurfing threshold volume (below KYC reporting tranches)');
  }
  if (muleScore > 30) {
    candidates.push({
      role: 'Potential Mule',
      score: Math.min(92, muleScore),
      description: 'Intermediate transit account utilized to fragment and pass through illicit tranches.',
      indicators: muleIndicators,
    });
  }

  // 5. Potential Cash-out Node
  let cashoutScore = 0;
  const cashIndicators: string[] = [];
  if (type === 'EXCHANGE' || type === 'ORGANIZATION' || explicitRole.includes('escrow') || explicitRole.includes('broker')) {
    cashoutScore += 45;
    cashIndicators.push('Commercial corporate shell, OTC desk, or crypto-to-fiat exit counterparty');
  }
  if (inDegree >= 2 && outDegree <= 1) {
    cashoutScore += 25;
    cashIndicators.push('Terminal recipient sink for multi-hop asset flows');
  }
  if (totalInflow > 8000000) {
    cashoutScore += 25;
    cashIndicators.push(`Significant fiat/stablecoin settlement volume ($${(totalInflow / 1000000).toFixed(1)}M)`);
  }
  if (cashoutScore > 30) {
    candidates.push({
      role: 'Potential Cash-out Node',
      score: Math.min(97, cashoutScore),
      description: 'Converts cryptocurrency into fiat banking escrow, real estate contracts, or cash liquidity.',
      indicators: cashIndicators,
    });
  }

  // 6. Potential Infrastructure Operator
  let infraScore = 0;
  const infraIndicators: string[] = [];
  if (type === 'IP' || type === 'DOMAIN' || type === 'SERVER') {
    infraScore += 40;
    infraIndicators.push('Network host or DNS endpoint supporting malicious operations');
  }
  if (explicitRole.includes('c2') || explicitRole.includes('infra')) {
    infraScore += 35;
    infraIndicators.push('Hosts active C2 listener, payload builder, or phishing reverse proxy');
  }
  if (infraScore > 30) {
    candidates.push({
      role: 'Potential Infrastructure Operator',
      score: Math.min(95, infraScore),
      description: 'Provides hosting, C2 routing, DNS proxying, or technical staging infrastructure.',
      indicators: infraIndicators,
    });
  }

  // 7. Potential Communication Node
  let commScore = 0;
  const commIndicators: string[] = [];
  if (type === 'PHONE' || type === 'EMAIL' || type === 'DEVICE') {
    commScore += 45;
    commIndicators.push('Direct telecom subscriber, email alias, or device endpoint');
  }
  if (connectedEdges.some((e) => e.type === 'COMMUNICATED_WITH' || e.type === 'INTERACTED_WITH')) {
    commScore += 35;
    commIndicators.push('Direct encrypted voice, SMS OTP, or messaging link with suspect entities');
  }
  if (commScore > 30) {
    candidates.push({
      role: 'Potential Communication Node',
      score: Math.min(94, commScore),
      description: 'Facilitates encrypted voice coordination, SMS OTP relays, or operational communications.',
      indicators: commIndicators,
    });
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    const defaultRole = `Potential ${entity.type || 'Entity'} Node`;
    return {
      primaryRole: defaultRole,
      confidence: 50,
      supporting_indicators: ['Correlated entity within active investigation network topology'],
      all_potential_roles: [
        {
          role: defaultRole,
          score: 50,
          description: 'Standard correlated network node.',
        },
      ],
    };
  }

  const best = candidates[0];
  return {
    primaryRole: best.role,
    confidence: best.score,
    supporting_indicators: best.indicators,
    all_potential_roles: candidates.map((c) => ({
      role: c.role,
      score: c.score,
      description: c.description,
    })),
  };
}
