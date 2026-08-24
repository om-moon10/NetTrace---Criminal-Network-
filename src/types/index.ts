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
