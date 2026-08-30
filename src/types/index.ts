export type EntityType =
  | 'crypto_wallet'
  | 'crypto_exchange'
  | 'ip_address'
  | 'domain'
  | 'url'
  | 'email'
  | 'phone'
  | 'device'
  | 'organization'
  | 'person'
  | 'server'
  | 'bank_account'
  | 'transaction'
  | 'blockchain'
  | 'WALLET'
  | 'TRANSACTION'
  | 'EXCHANGE'
  | 'BLOCKCHAIN'
  | 'DOMAIN'
  | 'IP'
  | 'EMAIL'
  | 'PHONE'
  | 'DEVICE'
  | 'ORGANIZATION';

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'neutral';

export type EntityRole =
  | 'kingpin'
  | 'facilitator'
  | 'mule'
  | 'c2_controller'
  | 'money_launderer'
  | 'developer'
  | 'infrastructure_provider'
  | 'victim'
  | 'unknown';

export type EntityStatus =
  | 'active'
  | 'frozen'
  | 'seized'
  | 'under_surveillance'
  | 'subpoena_pending'
  | 'cleared';

export interface EntityCentrality {
  betweenness: number;
  degree: number;
  closeness: number;
  pageRank: number;
  disruptionImpact: number;
}

export interface EntityMetadata {
  blockchain?: 'Bitcoin' | 'Ethereum' | 'Monero' | 'Tron' | 'Solana' | 'Tether-TRC20' | string;
  balanceUSD?: number;
  totalVolumeUSD?: number;
  country?: string;
  city?: string;
  asn?: string;
  isp?: string;
  registeredDate?: string;
  firstSeen?: string;
  lastSeen?: string;
  tags: string[];
  status?: EntityStatus;
  notes?: string;
  aliases?: string[];
  flaggedSanctions?: boolean;
  jurisdiction?: string;
  registrar?: string;
  fingerprintHash?: string;
  txId?: string;
  timestamp?: string;
  amount?: number;
  sender?: string;
  receiver?: string;
  type?: string;
  protocol?: string;
}

export interface Entity {
  id: string;
  label: string;
  name: string;
  type: EntityType;
  threatLevel: ThreatLevel;
  role: EntityRole;
  riskScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  centrality?: EntityCentrality;
  potentialRole?: string;
  potentialRoles?: { role: string; confidence: number; justification: string }[];
  clusterId?: string;
  metadata: EntityMetadata;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export type EdgeType =
  | 'financial_transaction'
  | 'network_traffic'
  | 'shared_whois'
  | 'communication'
  | 'co_location'
  | 'shared_device'
  | 'ownership'
  | 'credential_overlap'
  | 'TRANSFERRED_TO'
  | 'RECEIVED_FROM'
  | 'INTERACTED_WITH'
  | 'ROUTED_THROUGH'
  | 'BRIDGED_TO'
  | 'EXCHANGED_AT'
  | 'RECORDED_ON'
  | 'CONTROLLED_BY'
  | 'ASSOCIATED_WITH'
  | 'RESOLVES_TO'
  | 'HOSTED_ON'
  | 'COMMUNICATED_WITH'
  | 'FUNDED_BY'
  | 'CONNECTED_TO';

export interface EvidenceEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  value: number; // USD amount or weight
  currency?: string;
  txHash?: string;
  protocol?: string;
  timestamp: string;
  confidence: number;
  isEncrypted?: boolean;
  direction?: 'unidirectional' | 'bidirectional';
  notes?: string;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: 'active' | 'in_review' | 'indictment_ready' | 'archived';
  leadInvestigator: string;
  agency: string;
  classification: 'TLP:AMBER' | 'TLP:RED' | 'SECRET//NOFORN' | 'LAW ENFORCEMENT SENSITIVE';
  createdAt: string;
  updatedAt: string;
  nodes: Entity[];
  edges: EvidenceEdge[];
  summary: string;
  tags: string[];
  totalMonitoredFundsUSD: number;
  suspectsCount: number;
  infrastructureCount: number;
}

export interface DisruptionMetric {
  totalNodes: number;
  totalEdges: number;
  componentsCount: number;
  networkDensity: number;
  totalFlowUSD: number;
  isolatedNodesCount: number;
  disruptionPercentage: number;
}

export interface DisruptionSimulationResult {
  removedNodeIds: string[];
  baseline: DisruptionMetric;
  simulated: DisruptionMetric;
  componentSplits: {
    id: number;
    size: number;
    nodeIds: string[];
    dominantRole: string;
    flowValueUSD: number;
  }[];
  disconnectedNodes: Entity[];
  optimalCutRankings: {
    nodeId: string;
    nodeName: string;
    role: string;
    type: EntityType;
    disruptionScore: number;
    reason: string;
  }[];
}

export interface IngestionLog {
  id: string;
  sourceName: string;
  sourceType: 'blockchain_tx' | 'threat_feed' | 'whois_dump' | 'pcap_flow' | 'phone_cdr' | 'bank_subpoena' | 'manual';
  rawContent: string;
  parsedEntitiesCount: number;
  parsedEdgesCount: number;
  uploadedAt: string;
  confidenceWeight: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  entityIds: string[];
  category: 'transaction' | 'communication' | 'infrastructure_spawn' | 'surveillance_hit' | 'threat_alert';
  severity: 'critical' | 'high' | 'medium' | 'info';
  amountUSD?: number;
}

export interface IntelligenceBrief {
  id: string;
  type: 'executive_brief' | 'subpoena_packet' | 'mo_analysis' | 'interdiction_strategy' | 'entity_dossier';
  title: string;
  content: string;
  generatedAt: string;
  keyFindings: string[];
  recommendedWarrants: {
    target: string;
    jurisdiction: string;
    justification: string;
    urgency: 'critical' | 'high' | 'routine';
  }[];
  confidenceScore: number;
}

export interface KingpinFactorScore {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  description: string;
}

export interface SupportingEvidenceVector {
  vector: string;
  strength: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceMetric: number;
  details: string;
}

export interface KingpinCandidate {
  rank: number;
  entityId: string;
  entityName: string;
  entityLabel: string;
  entityType: string;
  threatLevel: string;
  role: string;
  kingpinScore: number;
  confidence: number;
  riskScore: number;
  statusTag: string;
  factors: {
    betweennessCentrality: number;
    crossClusterInfluence: number;
    transactionInfluence: number;
    degreeCentrality: number;
    investigativeRisk: number;
    evidenceStrength: number;
    infrastructureInfluence: number;
    closenessCentrality?: number;
  };
  factorBreakdown: KingpinFactorScore[];
  supportingIndicators: string[];
  primaryReasons: string[];
  supportingEvidence: SupportingEvidenceVector[];
  impactPreview: {
    currentConnections: number;
    affectedClusters: number;
    potentiallyIsolatedNodes: number;
    criticalPaths: number;
    potentiallyDisruptedRelationships: number;
    estimatedNetworkImpact: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  };
  connectedNeighbors: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    relationshipType: string;
  }>;
  metadata?: any;
}

export interface KingpinAnalysisResult {
  investigationId: string;
  candidates: KingpinCandidate[];
  topCandidate?: KingpinCandidate;
  totalEntitiesAnalyzed: number;
  disclaimer: string;
  emptyState?: boolean;
  emptyMessage?: string;
}

export interface NormalizedTimelineEvent {
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
  events: NormalizedTimelineEvent[];
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
  correlationStrength: number;
  confidence: number;
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
  events: NormalizedTimelineEvent[];
  insights: string;
  disclaimer: string;
  emptyState?: boolean;
  emptyMessage?: string;
}

export interface HiddenPathNode {
  id: string;
  label: string;
  name: string;
  type: string;
  role: string;
  threatLevel: string;
  riskScore: number;
  confidenceScore: number;
  clusterId?: string;
  domain: 'cyber' | 'financial' | 'identity' | 'infrastructure' | 'unknown';
}

export interface HiddenPathEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  value?: number;
  confidence: number;
  protocol?: string;
  timestamp?: string;
}

export interface PathIndicator {
  name: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface HiddenPathResult {
  id: string;
  pathIndex: number;
  name: string;
  tag: string;
  hops: number;
  strength: number;
  confidence: number;
  totalFlowUSD: number;
  nodeIds: string[];
  edgeIds: string[];
  nodes: HiddenPathNode[];
  edges: HiddenPathEdge[];
  domainTransitions: number;
  domainsTraversed: string[];
  isCrossDomain: boolean;
  explanation: string;
  indicators: {
    evidenceSupported: PathIndicator;
    temporalProximity: PathIndicator;
    sharedInfrastructure: PathIndicator;
    crossDomainBridging: PathIndicator;
  };
  evidenceCount: number;
  evidenceIds: string[];
  timelineCorrelationScore: number;
}

export interface HiddenRelationshipAnalysisResult {
  investigationId: string;
  summary: {
    totalHiddenRelationships: number;
    highRelevancePaths: number;
    entitiesAnalyzed: number;
    averagePathLength: number;
  };
  sourceEntity?: HiddenPathNode;
  targetEntity?: HiddenPathNode;
  isDirectlyConnected: boolean;
  directRelationshipCount: number;
  paths: HiddenPathResult[];
  recommendedPairs?: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: string;
    targetId: string;
    targetName: string;
    targetType: string;
    estimatedStrength: number;
    hops: number;
    reason: string;
  }>;
  disclaimer: string;
}

export interface CopilotAction {
  label: string;
  view: string;
  entityId?: string;
  pathNodeIds?: string[];
}

export interface CopilotReferencedEntity {
  id: string;
  name: string;
  label: string;
  type: string;
  role: string;
  riskScore: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  time: string;
  suggestedQuestions?: string[];
  suggestedActions?: CopilotAction[];
  referencedEntities?: CopilotReferencedEntity[];
  confidenceScore?: number;
  generatedBy?: string;
  disclaimer?: string;
}

export interface CopilotResponse {
  reply: string;
  suggestedQuestions: string[];
  suggestedActions: CopilotAction[];
  referencedEntities: CopilotReferencedEntity[];
  confidenceScore: number;
  generatedBy: string;
  disclaimer: string;
}


