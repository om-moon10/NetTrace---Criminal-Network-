/**
 * NetTrace Client API Service
 * Connects frontend views directly to the Node.js Express + SQLite backend.
 */

// Use configured VITE_API_URL or fallback to relative URL (same-origin / reverse proxy)
const API_BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Request to ${endpoint} failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch (e) {}
      throw new ApiError(errMsg, res.status);
    }

    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network connectivity / CORS error
    console.warn(`[NetTrace API] Network error calling ${url}:`, error.message);
    throw new ApiError(`NetTrace API unavailable: ${error.message || 'Connection failed'}`);
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; service: string }>('/api/health'),

  // Dashboard
  getDashboard: () =>
    request<{
      metrics: {
        activeInvestigations: number;
        highRiskNetworks: number;
        criticalEntities: number;
        suspiciousEvents: number;
        evidenceItems: number;
        totalMonitoredFundsUSD: number;
      };
      investigations: any[];
      recentActivity: any[];
      topThreatEntities: any[];
    }>('/api/dashboard'),

  // Investigations
  getInvestigations: () => request<{ investigations: any[] }>('/api/investigations'),
  
  getInvestigation: (id: string) => request<{ investigation: any }>(`/api/investigations/${id}`),

  getInvestigationGraph: (id: string) =>
    request<{
      investigationId: string;
      nodes: any[];
      edges: any[];
      metrics: any;
    }>(`/api/investigations/${id}/graph`),

  getInvestigationEvidence: (id: string) =>
    request<{ evidence: any[] }>(`/api/investigations/${id}/evidence`),

  getInvestigationTimeline: (id: string) =>
    request<{ timeline: any[] }>(`/api/investigations/${id}/timeline`),

  getInvestigationPriorities: (id: string) =>
    request<{
      investigationId: string;
      priorities: any[];
    }>(`/api/investigations/${id}/priorities`),

  // Entities
  getEntity: (id: string) => request<{ entity: any }>(`/api/entities/${id}`),

  getEntityConnections: (id: string) =>
    request<{
      entityId: string;
      totalConnections: number;
      edges: any[];
      connectedEntities: any[];
    }>(`/api/entities/${id}/connections`),

  // Evidence
  addEvidence: (data: {
    investigationId?: string;
    entityId?: string;
    sourceName: string;
    sourceType?: string;
    rawContent: string;
    extractedIndicators?: string[];
    confidenceWeight?: number;
  }) =>
    request<{ message: string; evidence: any }>('/api/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Graph & Entity Analysis
  analyzeNetwork: (investigationId: string = 'NX-102') =>
    request<{
      investigationId: string;
      graphMetrics: any;
      risk: any;
      priorities: any[];
      aiExplanation: any;
    }>('/api/analyze/network', {
      method: 'POST',
      body: JSON.stringify({ investigationId }),
    }),

  analyzeEntity: (id: string) =>
    request<{
      entity: any;
      risk: any;
      potentialRoles: any;
      centrality: any;
      aiAnalysis: any;
    }>(`/api/analyze/entity/${id}`, {
      method: 'POST',
    }),

  // Network Disruption Simulation
  simulate: (data: { investigationId?: string; entityId?: string; entityIds?: string[]; removedNodeIds?: string[] }) =>
    request<{
      investigationId: string;
      simulation: any;
      targetEntityIds: string[];
      before: any;
      after: any;
      difference: any;
      disruption_level: string;
      explanation: string;
    }>('/api/simulation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Threat Intelligence (ThreatView)
  analyzeThreatIntel: (data: { url?: string; domain?: string; ip?: string; address?: string }) =>
    request<{
      url?: string;
      domain?: string;
      ip?: string;
      threat_score: number;
      classification: string;
      risk: string;
      confidence?: number;
      indicators: string[];
      autonomous_system?: string;
      geolocation?: string;
      ssl_issuer?: string;
      source: string;
      analyzed_at: string;
    }>('/api/threat-intel/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  ingestThreatIntel: (data: { investigationId?: string; result: any }) =>
    request<{
      success: boolean;
      evidenceId: string;
      matchedEntities: Array<{
        id: string;
        name: string;
        label: string;
        type: string;
        matchReason: string;
      }>;
      newEntities: Array<{
        id: string;
        name: string;
        label: string;
        type: string;
        riskScore: number;
      }>;
      newRelationships: Array<{
        id: string;
        source: string;
        target: string;
        type: string;
        label?: string;
      }>;
      correlations: Array<{
        entityId: string;
        entityName: string;
        entityType: string;
        score: number;
        factors: string[];
        path: string[];
        pathNames: string[];
        disclaimer: string;
      }>;
      riskBefore: number;
      riskAfter: number;
      breakdownBefore?: any;
      breakdownAfter?: any;
      priorityChanged: boolean;
      prioritySummary?: {
        topEntityId: string;
        previousRank?: number;
        newRank?: number;
        priorityScore: number;
        reasons: string[];
      };
    }>('/api/threat-intel/ingest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // AI Explanations & Summaries
  explainAI: (data: { type: 'network' | 'entity'; investigationId?: string; entityId?: string }) =>
    request<{
      explanation?: string;
      whyImportant?: string;
      tacticalAdvice?: string;
      summary?: string;
      strategicRecommendations?: string[];
      disruptionAnalysis?: string;
      generatedBy?: string;
    }>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReportSummary: (investigationId: string = 'NX-102') =>
    request<any>('/api/ai/report-summary', {
      method: 'POST',
      body: JSON.stringify({ investigationId }),
    }),

  getReport: (investigationId: string = 'NX-102') =>
    request<{
      investigationId: string;
      report: any;
      risk: any;
      priorities: any[];
      metrics: any;
    }>(`/api/reports/${investigationId}`),
};
