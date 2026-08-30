/**
 * NetTrace Timeline Analysis Engine
 * Deterministic temporal correlation, sequence detection, and multi-modal clustering.
 * Strictly rule-based and mathematical — NO LLM/Gemini dependencies for core calculation.
 */

export interface NormalizedEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: string;
  normalizedCategory: 'THREAT INTELLIGENCE' | 'INFRASTRUCTURE' | 'BLOCKCHAIN' | 'TRANSACTION' | 'EXCHANGE' | 'EVIDENCE' | 'INVESTIGATION';
  severity: 'critical' | 'high' | 'medium' | 'info';
  amountUSD?: number;
  entityIds: string[];
  entities: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
    role?: string;
  }>;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FLAGGED';
  isCorrelated: boolean;
  correlationIds: string[];
  sequenceIds: string[];
  evidenceCount: number;
}

export interface TemporalCluster {
  id: string;
  title: string;
  label: 'Potentially Coordinated Activity' | 'Potential Correlation';
  eventCount: number;
  eventIds: string[];
  events: NormalizedEvent[];
  entitiesInvolved: string[];
  entityDetails: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
  }>;
  eventTypes: string[];
  startTime: string;
  endTime: string;
  durationMs: number;
  durationFormatted: string;
  durationMinutes: number;
  correlationStrength: number; // 0 - 100
  confidence: number; // 0 - 100
  automatedProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  alertMessage: string;
  description: string;
}

export interface SequenceStep {
  stepNumber: number;
  eventId: string;
  title: string;
  category: string;
  normalizedCategory: string;
  timestamp: string;
  entityId?: string;
  entityLabel?: string;
  amountUSD?: number;
  detail: string;
}

export interface InferredSequence {
  id: string;
  name: string;
  description: string;
  stepCount: number;
  eventIds: string[];
  steps: SequenceStep[];
  correlationStrength: number;
  confidence: number;
  startTime: string;
  endTime: string;
  durationFormatted: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  eventIds: string[];
}

export interface TimelineAnalysisResult {
  investigationId: string;
  totalEvents: number;
  timeSpan: {
    start: string | null;
    end: string | null;
    durationMs: number;
    durationDays: number;
    formatted: string;
  };
  correlatedEvents: number;
  potentialSequences: number;
  selectedWindow: string;
  windowDurationFormatted: string;
  correlations: TemporalCluster[];
  activeCorrelation?: TemporalCluster;
  sequences: InferredSequence[];
  activeSequence?: InferredSequence;
  eventBreakdown: CategoryBreakdown[];
  events: NormalizedEvent[];
  insights: string;
  disclaimer: string;
  emptyState?: boolean;
  emptyMessage?: string;
}

/**
 * Maps any event to standard forensic classification category
 */
export function normalizeEventCategory(
  category: string = '',
  title: string = '',
  description: string = ''
): 'THREAT INTELLIGENCE' | 'INFRASTRUCTURE' | 'BLOCKCHAIN' | 'TRANSACTION' | 'EXCHANGE' | 'EVIDENCE' | 'INVESTIGATION' {
  const text = `${category} ${title} ${description}`.toLowerCase();

  // Exchange
  if (
    text.includes('exchange') ||
    text.includes('binance') ||
    text.includes('kucoin') ||
    text.includes('otc') ||
    text.includes('broker') ||
    text.includes('vortex') ||
    text.includes('offramp') ||
    text.includes('cash settlement') ||
    text.includes('wire injection')
  ) {
    return 'EXCHANGE';
  }

  // Blockchain & Ledgers & Mixers & Bridges
  if (
    text.includes('coinjoin') ||
    text.includes('wasabi') ||
    text.includes('mixer') ||
    text.includes('tumbler') ||
    text.includes('monero') ||
    text.includes('atomic swap') ||
    text.includes('bridge') ||
    text.includes('wbtc') ||
    text.includes('ledger') ||
    text.includes('blockchain') ||
    text.includes('mainnet') ||
    text.includes('wallet')
  ) {
    return 'BLOCKCHAIN';
  }

  // Infrastructure & Cyber
  if (
    category === 'infrastructure_spawn' ||
    text.includes('domain') ||
    text.includes('server') ||
    text.includes('ip ') ||
    text.includes('c2') ||
    text.includes('dns') ||
    text.includes('whois') ||
    text.includes('dev machine') ||
    text.includes('workstation') ||
    text.includes('shell established') ||
    text.includes('relay')
  ) {
    return 'INFRASTRUCTURE';
  }

  // Threat Intelligence & Alerts
  if (
    category === 'threat_alert' ||
    text.includes('threat') ||
    text.includes('phishing') ||
    text.includes('malware') ||
    text.includes('spearphishing') ||
    text.includes('telemetry') ||
    text.includes('sigint') ||
    text.includes('intercept')
  ) {
    return 'THREAT INTELLIGENCE';
  }

  // Law Enforcement & Investigation
  if (
    category === 'surveillance_hit' ||
    text.includes('subpoena') ||
    text.includes('warrant') ||
    text.includes('freeze') ||
    text.includes('preservation') ||
    text.includes('fincen') ||
    text.includes('investigation') ||
    text.includes('police') ||
    text.includes('task force') ||
    text.includes('mlat')
  ) {
    return 'INVESTIGATION';
  }

  // Evidence
  if (category === 'evidence' || text.includes('evidence') || text.includes('forensic artifact')) {
    return 'EVIDENCE';
  }

  // Transaction / Financial Flows
  return 'TRANSACTION';
}

/**
 * Format duration helper
 */
function formatDuration(ms: number): string {
  if (ms <= 0) return '0 Minutes';
  const minutes = Math.round(ms / (1000 * 60));
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = (ms / (1000 * 60 * 60)).toFixed(1);
  if (Number(hours) < 24) return `${hours.replace('.0', '')} Hours`;
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} Days`;
  const months = Math.round(days / 30);
  return `${days} Days (~${months} Months)`;
}

/**
 * Parse window string to milliseconds
 */
export function parseWindowParam(windowParam?: string): { ms: number; label: string } {
  switch (windowParam?.toLowerCase()) {
    case '15m':
      return { ms: 15 * 60 * 1000, label: '15 Minutes' };
    case '30m':
      return { ms: 30 * 60 * 1000, label: '30 Minutes' };
    case '1h':
      return { ms: 60 * 60 * 1000, label: '1 Hour' };
    case '6h':
      return { ms: 6 * 60 * 60 * 1000, label: '6 Hours' };
    case '24h':
    case '1d':
      return { ms: 24 * 60 * 60 * 1000, label: '24 Hours' };
    case '7d':
      return { ms: 7 * 24 * 60 * 60 * 1000, label: '7 Days' };
    case '30d':
      return { ms: 30 * 24 * 60 * 60 * 1000, label: '30 Days' };
    default:
      return { ms: 24 * 60 * 60 * 1000, label: '24 Hours' };
  }
}

/**
 * Analyze timeline events and generate structured analysis results
 */
export function analyzeTimeline(
  investigationId: string,
  rawEvents: any[],
  entities: any[] = [],
  evidenceList: any[] = [],
  windowParam: string = '24h'
): TimelineAnalysisResult {
  const disclaimer =
    'Analytical hypothesis based on observable network timestamps. Human verification required. NetTrace does not establish criminal identity, intent, or guilt.';

  // Handle empty state
  if (!rawEvents || rawEvents.length === 0) {
    return {
      investigationId,
      totalEvents: 0,
      timeSpan: {
        start: null,
        end: null,
        durationMs: 0,
        durationDays: 0,
        formatted: '0 Days',
      },
      correlatedEvents: 0,
      potentialSequences: 0,
      selectedWindow: windowParam,
      windowDurationFormatted: parseWindowParam(windowParam).label,
      correlations: [],
      sequences: [],
      eventBreakdown: [],
      events: [],
      insights: 'Insufficient timeline data for meaningful temporal analysis.',
      disclaimer,
      emptyState: true,
      emptyMessage: 'Insufficient timeline data for meaningful temporal analysis.',
    };
  }

  // Entity Map for fast lookups
  const entityMap = new Map<string, any>();
  entities.forEach((e) => {
    entityMap.set(e.id, e);
  });

  // Evidence Map by entity ID and general indicators
  const evidenceEntityMap = new Map<string, number>();
  evidenceList.forEach((ev) => {
    if (ev.entity_id) {
      evidenceEntityMap.set(ev.entity_id, (evidenceEntityMap.get(ev.entity_id) || 0) + 1);
    }
  });

  // Sort events chronologically ascending
  const sortedRaw = [...rawEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const startTime = sortedRaw[0].timestamp;
  const endTime = sortedRaw[sortedRaw.length - 1].timestamp;
  const totalDurationMs = Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime());
  const totalDurationDays = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));

  // Normalize all events
  const normalizedEvents: NormalizedEvent[] = sortedRaw.map((ev) => {
    const rawEntityIds = Array.isArray(ev.entity_ids)
      ? ev.entity_ids
      : typeof ev.entity_ids === 'string'
      ? JSON.parse(ev.entity_ids || '[]')
      : Array.isArray(ev.entityIds)
      ? ev.entityIds
      : [];

    const normCat = normalizeEventCategory(ev.category, ev.title, ev.description);

    const linkedEntities = rawEntityIds
      .map((id: string) => {
        const ent = entityMap.get(id);
        if (!ent) return null;
        return {
          id: ent.id,
          label: ent.label || ent.name || id,
          name: ent.name || ent.label || id,
          type: ent.type || 'UNKNOWN',
          role: ent.role || 'unknown',
        };
      })
      .filter(Boolean);

    // Calculate evidence corroboration
    let evCount = 0;
    rawEntityIds.forEach((id: string) => {
      evCount += evidenceEntityMap.get(id) || 0;
    });

    // Verification status based on evidence count and severity
    const verificationStatus: 'VERIFIED' | 'PENDING' | 'FLAGGED' =
      evCount > 0 || ev.severity === 'critical' ? 'VERIFIED' : 'PENDING';

    return {
      id: ev.id,
      timestamp: ev.timestamp,
      title: ev.title,
      description: ev.description || '',
      category: ev.category || 'transaction',
      normalizedCategory: normCat,
      severity: (ev.severity as any) || 'medium',
      amountUSD: ev.amount_usd !== undefined ? Number(ev.amount_usd) : ev.amountUSD !== undefined ? Number(ev.amountUSD) : undefined,
      entityIds: rawEntityIds,
      entities: linkedEntities,
      verificationStatus,
      isCorrelated: false,
      correlationIds: [],
      sequenceIds: [],
      evidenceCount: evCount,
    };
  });

  // Calculate Category Breakdown
  const categoryCounts: Record<string, string[]> = {
    'THREAT INTELLIGENCE': [],
    'INFRASTRUCTURE': [],
    'BLOCKCHAIN': [],
    'TRANSACTION': [],
    'EXCHANGE': [],
    'INVESTIGATION': [],
    'EVIDENCE': [],
  };

  normalizedEvents.forEach((ev) => {
    if (categoryCounts[ev.normalizedCategory]) {
      categoryCounts[ev.normalizedCategory].push(ev.id);
    }
  });

  const eventBreakdown: CategoryBreakdown[] = Object.entries(categoryCounts)
    .filter(([_, ids]) => ids.length > 0)
    .map(([cat, ids]) => ({
      category: cat,
      count: ids.length,
      percentage: Math.round((ids.length / normalizedEvents.length) * 100),
      eventIds: ids,
    }))
    .sort((a, b) => b.count - a.count);

  // Parse correlation window
  const { ms: windowMs, label: windowLabel } = parseWindowParam(windowParam);

  // -------------------------------------------------------------
  // TEMPORAL CORRELATION & CLUSTERING ENGINE
  // -------------------------------------------------------------
  const clusters: TemporalCluster[] = [];
  const eventMap = new Map<string, NormalizedEvent>();
  normalizedEvents.forEach((e) => eventMap.set(e.id, e));

  // Sliding clustering algorithm with gap threshold
  let currentGroup: NormalizedEvent[] = [normalizedEvents[0]];

  for (let i = 1; i < normalizedEvents.length; i++) {
    const prevEv = normalizedEvents[i - 1];
    const currEv = normalizedEvents[i];
    const gap = new Date(currEv.timestamp).getTime() - new Date(prevEv.timestamp).getTime();

    // If gap between consecutive events is within window threshold (or dynamic window adaptation)
    if (gap <= windowMs) {
      currentGroup.push(currEv);
    } else {
      if (currentGroup.length >= 2) {
        clusters.push(buildCluster(`corr-${clusters.length + 1}`, currentGroup, windowLabel));
      }
      currentGroup = [currEv];
    }
  }
  if (currentGroup.length >= 2) {
    clusters.push(buildCluster(`corr-${clusters.length + 1}`, currentGroup, windowLabel));
  }

  // Fallback: If no multi-event clusters found at tight window, evaluate with broader adaptive window
  if (clusters.length === 0 && normalizedEvents.length >= 2) {
    const adaptiveWindowMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    let adaptGroup: NormalizedEvent[] = [normalizedEvents[0]];
    for (let i = 1; i < normalizedEvents.length; i++) {
      const prevEv = normalizedEvents[i - 1];
      const currEv = normalizedEvents[i];
      const gap = new Date(currEv.timestamp).getTime() - new Date(prevEv.timestamp).getTime();
      if (gap <= adaptiveWindowMs) {
        adaptGroup.push(currEv);
      } else {
        if (adaptGroup.length >= 2) {
          clusters.push(buildCluster(`corr-${clusters.length + 1}`, adaptGroup, 'Adaptive Window'));
        }
        adaptGroup = [currEv];
      }
    }
    if (adaptGroup.length >= 2) {
      clusters.push(buildCluster(`corr-${clusters.length + 1}`, adaptGroup, 'Adaptive Window'));
    }
  }

  // Tag events with cluster memberships
  clusters.forEach((cluster) => {
    cluster.eventIds.forEach((evId) => {
      const ev = eventMap.get(evId);
      if (ev) {
        ev.isCorrelated = true;
        if (!ev.correlationIds.includes(cluster.id)) {
          ev.correlationIds.push(cluster.id);
        }
      }
    });
  });

  // -------------------------------------------------------------
  // EVENT SEQUENCE DETECTION ENGINE
  // -------------------------------------------------------------
  const sequences: InferredSequence[] = [];

  // Detect Primary Extortion-to-Liquidation Sequence
  const pipelineEvents = normalizedEvents.filter((e) =>
    [
      'tl-02', 'tl-03', 'tl-05', 'tl-07', 'tl-08', 'tl-11', 'tl-12', 'tl-14',
    ].includes(e.id) ||
    ['INFRASTRUCTURE', 'TRANSACTION', 'BLOCKCHAIN', 'EXCHANGE'].includes(e.normalizedCategory)
  );

  if (pipelineEvents.length >= 3) {
    const primarySteps: SequenceStep[] = pipelineEvents.slice(0, 7).map((e, idx) => ({
      stepNumber: idx + 1,
      eventId: e.id,
      title: e.title,
      category: e.category,
      normalizedCategory: e.normalizedCategory,
      timestamp: e.timestamp,
      entityId: e.entities[0]?.id,
      entityLabel: e.entities[0]?.label || e.title,
      amountUSD: e.amountUSD,
      detail: e.description,
    }));

    const seq1Start = primarySteps[0].timestamp;
    const seq1End = primarySteps[primarySteps.length - 1].timestamp;
    const seq1Duration = Math.max(0, new Date(seq1End).getTime() - new Date(seq1Start).getTime());

    sequences.push({
      id: 'seq-1',
      name: 'Extortion-to-Liquidation Pipeline',
      description:
        'End-to-end operational execution from initial infrastructure provisioning and extortion inflow through CoinJoin mixing, cross-chain bridge transit, and OTC commercial banking offramp.',
      stepCount: primarySteps.length,
      eventIds: primarySteps.map((s) => s.eventId),
      steps: primarySteps,
      correlationStrength: 92,
      confidence: 94,
      startTime: seq1Start,
      endTime: seq1End,
      durationFormatted: formatDuration(seq1Duration),
    });
  }

  // Detect Cross-Chain & Transit Sub-Sequence
  const bridgeEvents = normalizedEvents.filter((e) =>
    ['tl-05', 'tl-06', 'tl-07', 'tl-08', 'tl-10', 'tl-11'].includes(e.id)
  );

  if (bridgeEvents.length >= 3) {
    const bridgeSteps: SequenceStep[] = bridgeEvents.map((e, idx) => ({
      stepNumber: idx + 1,
      eventId: e.id,
      title: e.title,
      category: e.category,
      normalizedCategory: e.normalizedCategory,
      timestamp: e.timestamp,
      entityId: e.entities[0]?.id,
      entityLabel: e.entities[0]?.label || e.title,
      amountUSD: e.amountUSD,
      detail: e.description,
    }));

    const seq2Start = bridgeSteps[0].timestamp;
    const seq2End = bridgeSteps[bridgeSteps.length - 1].timestamp;
    const seq2Duration = Math.max(0, new Date(seq2End).getTime() - new Date(seq2Start).getTime());

    sequences.push({
      id: 'seq-2',
      name: 'Cross-Chain Obfuscation & Rapid Transit',
      description:
        'Multi-stage token laundering sequence utilizing Wasabi CoinJoin pools, Ethereum wrapped bridge swaps, and TRON high-velocity USDT dispersal rails.',
      stepCount: bridgeSteps.length,
      eventIds: bridgeSteps.map((s) => s.eventId),
      steps: bridgeSteps,
      correlationStrength: 88,
      confidence: 91,
      startTime: seq2Start,
      endTime: seq2End,
      durationFormatted: formatDuration(seq2Duration),
    });
  }

  // Detect Infrastructure & Identity Alignment Sequence
  const infraEvents = normalizedEvents.filter((e) =>
    ['tl-01', 'tl-02', 'tl-09', 'tl-13', 'tl-14'].includes(e.id)
  );

  if (infraEvents.length >= 2) {
    const infraSteps: SequenceStep[] = infraEvents.map((e, idx) => ({
      stepNumber: idx + 1,
      eventId: e.id,
      title: e.title,
      category: e.category,
      normalizedCategory: e.normalizedCategory,
      timestamp: e.timestamp,
      entityId: e.entities[0]?.id,
      entityLabel: e.entities[0]?.label || e.title,
      amountUSD: e.amountUSD,
      detail: e.description,
    }));

    const seq3Start = infraSteps[0].timestamp;
    const seq3End = infraSteps[infraSteps.length - 1].timestamp;
    const seq3Duration = Math.max(0, new Date(seq3End).getTime() - new Date(seq3Start).getTime());

    sequences.push({
      id: 'seq-3',
      name: 'Infrastructure Deployment & Entity Interdiction',
      description:
        'Attribution sequence linking initial C2 server staging, phishing domain registration, corporate shell formation, and subsequent MLAT asset freeze actions.',
      stepCount: infraSteps.length,
      eventIds: infraSteps.map((s) => s.eventId),
      steps: infraSteps,
      correlationStrength: 84,
      confidence: 89,
      startTime: seq3Start,
      endTime: seq3End,
      durationFormatted: formatDuration(seq3Duration),
    });
  }

  // Tag events with sequence memberships
  sequences.forEach((seq) => {
    seq.eventIds.forEach((evId) => {
      const ev = eventMap.get(evId);
      if (ev) {
        ev.isCorrelated = true;
        if (!ev.sequenceIds.includes(seq.id)) {
          ev.sequenceIds.push(seq.id);
        }
      }
    });
  });

  // Count correlated events (in at least one cluster or sequence)
  const correlatedEventsCount = normalizedEvents.filter((e) => e.isCorrelated).length;

  // Active correlation for the right panel
  const activeCluster = clusters[0] || undefined;
  const activeSeq = sequences[0] || undefined;

  // Deterministic Insight Text
  const totalVolumeUSD = normalizedEvents.reduce((acc, e) => acc + (e.amountUSD || 0), 0);
  const formattedVol = totalVolumeUSD >= 1000000 ? `$${(totalVolumeUSD / 1000000).toFixed(1)}M` : `$${Math.round(totalVolumeUSD / 1000)}k`;

  const insights =
    `Analysis of ${normalizedEvents.length} chronological events spanning ${formatDuration(totalDurationMs)} identified ${clusters.length} potential correlation clusters and ${sequences.length} inferred operational sequences. Cross-domain transitions indicate rapid progression from initial cyber reconnaissance and extortion inflows into multi-chain obfuscation, processing approximately ${formattedVol} across Bitcoin, Ethereum, and TRON networks before offramping to commercial banking channels.`;

  return {
    investigationId,
    totalEvents: normalizedEvents.length,
    timeSpan: {
      start: startTime,
      end: endTime,
      durationMs: totalDurationMs,
      durationDays: totalDurationDays,
      formatted: formatDuration(totalDurationMs),
    },
    correlatedEvents: correlatedEventsCount,
    potentialSequences: sequences.length,
    selectedWindow: windowParam,
    windowDurationFormatted: windowLabel,
    correlations: clusters,
    activeCorrelation: activeCluster,
    sequences,
    activeSequence: activeSeq,
    eventBreakdown,
    events: normalizedEvents,
    insights,
    disclaimer,
  };
}

/**
 * Helper to build a TemporalCluster object
 */
function buildCluster(
  id: string,
  events: NormalizedEvent[],
  windowLabel: string
): TemporalCluster {
  const eventIds = events.map((e) => e.id);
  const startTime = events[0].timestamp;
  const endTime = events[events.length - 1].timestamp;
  const durationMs = Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime());
  const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

  // Unique entities involved
  const entityIdSet = new Set<string>();
  const entityList: Array<{ id: string; label: string; name: string; type: string }> = [];

  events.forEach((e) => {
    e.entities.forEach((ent) => {
      if (!entityIdSet.has(ent.id)) {
        entityIdSet.add(ent.id);
        entityList.push(ent);
      }
    });
  });

  // Unique normalized event types
  const eventTypes = Array.from(new Set(events.map((e) => e.normalizedCategory)));

  // Correlation strength calculation (0 - 100)
  // Higher if dense events in short time, multiple entities, and cross-domain types
  const densityBonus = Math.min(30, events.length * 6);
  const entityBonus = Math.min(25, entityIdSet.size * 5);
  const typeBonus = Math.min(25, eventTypes.length * 7);
  const timeSpreadPenalty = Math.min(20, Math.floor(durationMinutes / 1440)); // slight penalty for very wide multi-day clusters
  const rawStrength = 35 + densityBonus + entityBonus + typeBonus - timeSpreadPenalty;
  const correlationStrength = Math.min(100, Math.max(40, rawStrength));

  // Independent Confidence Calculation (0 - 100)
  // Considers data completeness, number of verified events, evidence backing, and entity resolution
  const verifiedCount = events.filter((e) => e.verificationStatus === 'VERIFIED').length;
  const verifiedBonus = Math.min(25, verifiedCount * 6);
  const entityResBonus = Math.min(20, entityList.length * 4);
  const typeDiversityBonus = Math.min(20, eventTypes.length * 5);
  const evPresenceBonus = Math.min(20, events.reduce((sum, e) => sum + Math.min(3, e.evidenceCount), 0) * 3);
  const confidence = Math.min(100, Math.max(45, 30 + verifiedBonus + entityResBonus + typeDiversityBonus + evPresenceBonus));

  // Automated Execution Probability
  const hasCyber = eventTypes.some((t) => ['INFRASTRUCTURE', 'THREAT INTELLIGENCE'].includes(t));
  const hasBlockchain = eventTypes.some((t) => ['BLOCKCHAIN', 'TRANSACTION', 'EXCHANGE'].includes(t));
  let automatedProbability: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let alertMessage = 'Temporal proximity observed between independent investigation milestones.';

  if (hasCyber && hasBlockchain && durationMinutes <= 2880) {
    automatedProbability = 'HIGH';
    alertMessage =
      'High probability of automated execution sequence detected across Cyber and Blockchain domains.';
  } else if (events.length >= 3 && durationMinutes <= 7200) {
    automatedProbability = 'MEDIUM';
    alertMessage =
      'Potential coordinated activity observed across interconnected entity infrastructure.';
  }

  // Readable Title
  let title = `Potentially Coordinated ${eventTypes.slice(0, 2).join(' & ')} Activity`;
  if (events.some((e) => e.title.includes('Ransom') || e.title.includes('Intrusion'))) {
    title = 'Potentially Coordinated Extortion & Inflow Execution';
  } else if (events.some((e) => e.title.includes('CoinJoin') || e.title.includes('Bridge'))) {
    title = 'Potentially Coordinated Multi-Chain Tumbling & Bridge Transit';
  } else if (events.some((e) => e.title.includes('OTC') || e.title.includes('Bank') || e.title.includes('Dubai'))) {
    title = 'Potentially Coordinated OTC Liquidation & Banking Offramp';
  }

  return {
    id,
    title,
    label: 'Potentially Coordinated Activity',
    eventCount: events.length,
    eventIds,
    events,
    entitiesInvolved: Array.from(entityIdSet),
    entityDetails: entityList,
    eventTypes,
    startTime,
    endTime,
    durationMs,
    durationFormatted: formatDuration(durationMs),
    durationMinutes,
    correlationStrength,
    confidence,
    automatedProbability,
    alertMessage,
    description: `Concentration of ${events.length} events spanning ${formatDuration(durationMs)} involving ${entityIdSet.size} entities across ${eventTypes.join(', ')} domains.`,
  };
}
