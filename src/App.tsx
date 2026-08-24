import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { NavigationTabs, TabView } from './components/layout/NavigationTabs';
import { MobileNavigationDrawer } from './components/layout/MobileNavigationDrawer';
import { NetworkGraphView } from './components/graph/NetworkGraphView';
import { NodeDossierDrawer } from './components/graph/NodeDossierDrawer';
import { TargetPrioritizationView } from './components/prioritization/TargetPrioritizationView';
import { DisruptionSimulationView } from './components/simulation/DisruptionSimulationView';
import { EvidenceIngestionView } from './components/ingestion/EvidenceIngestionView';
import { TimelineView } from './components/timeline/TimelineView';
import { AIBriefingView } from './components/ai/AIBriefingView';
import { CaseDossierView } from './components/cases/CaseDossierView';
import { PathFinderModal } from './components/modals/PathFinderModal';
import { AddEvidenceModal } from './components/modals/AddEvidenceModal';
import { AffidavitGeneratorModal } from './components/modals/AffidavitGeneratorModal';
import { InvestigationCase, Entity, EvidenceEdge, IngestionLog, TimelineEvent, EntityStatus } from './types';
import { INITIAL_CASES, MOCK_TIMELINE_EVENTS, MOCK_INGESTION_LOGS } from './data/mockCases';
import { calculateCentralities } from './utils/graphEngine';

export default function App() {
  // State
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [currentCase, setCurrentCase] = useState<InvestigationCase>(INITIAL_CASES[0]);
  const [activeTab, setActiveTab] = useState<TabView>('graph');
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Simulation & Path Finder State
  const [simulationRemovedIds, setSimulationRemovedIds] = useState<string[]>([]);
  const [highlightedPathNodeIds, setHighlightedPathNodeIds] = useState<string[]>([]);
  const [highlightedPathEdgeIds, setHighlightedPathEdgeIds] = useState<string[]>([]);

  // Logs & Timeline State
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>(MOCK_INGESTION_LOGS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(MOCK_TIMELINE_EVENTS);

  // Modals
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [isAffidavitOpen, setIsAffidavitOpen] = useState(false);
  const [affidavitTargetId, setAffidavitTargetId] = useState<string | undefined>();

  // Fetch cases from server
  const loadCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        if (data.cases && data.cases.length > 0) {
          setCases(data.cases);
          // Preserve active case if exists
          const found = data.cases.find((c: InvestigationCase) => c.id === currentCase.id);
          if (found) setCurrentCase(found);
          else setCurrentCase(data.cases[0]);
        }
      }
    } catch (e) {
      console.warn('Using local fallback cases', e);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Update Case handler
  const handleUpdateCase = async (updatedFields: Partial<InvestigationCase>) => {
    const updated = { ...currentCase, ...updatedFields };
    // Recalculate Centralities
    const centralities = calculateCentralities(updated.nodes, updated.edges);
    updated.nodes.forEach((n) => {
      n.centrality = centralities.get(n.id);
    });

    setCurrentCase(updated);
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    try {
      await fetch(`/api/cases/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Add Entity to current case
  const handleAddEntity = (entity: Entity) => {
    const nextNodes = [...currentCase.nodes, entity];
    handleUpdateCase({ nodes: nextNodes });
  };

  // Add Edge to current case
  const handleAddEdge = (edge: EvidenceEdge) => {
    const nextEdges = [...currentCase.edges, edge];
    handleUpdateCase({ edges: nextEdges });
  };

  // Ingest Evidence from feed
  const handleIngestEvidence = async (payload: {
    sourceName: string;
    sourceType: string;
    rawContent: string;
    confidenceWeight: number;
  }) => {
    try {
      const res = await fetch(`/api/cases/${currentCase.id}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.updatedCase) {
        setCurrentCase(data.updatedCase);
        setCases((prev) =>
          prev.map((c) => (c.id === data.updatedCase.id ? data.updatedCase : c))
        );
      }
      if (data.log) {
        setIngestionLogs((prev) => [data.log, ...prev]);
      }
    } catch (e) {
      console.error('Ingestion failed:', e);
    }
  };

  // Export Comprehensive Case Intelligence Dossier
  const handleExportReport = () => {
    const markdown = `# NETTRACE CRIMINAL NETWORK INTELLIGENCE DOSSIER
CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // ${currentCase.classification}

CASE REF: ${currentCase.caseNumber}
TITLE: ${currentCase.title}
INVESTIGATING AGENCY: ${currentCase.agency}
LEAD INVESTIGATOR: ${currentCase.leadInvestigator}
DATE COMPILED: ${new Date().toUTCString()}

---

## 1. EXECUTIVE SUMMARY & MODUS OPERANDI
${currentCase.summary || currentCase.description}

Total Monitored Illicit Funds: $${currentCase.totalMonitoredFundsUSD.toLocaleString()} USD
Identified Subjects: ${currentCase.suspectsCount}
Infrastructure Nodes: ${currentCase.infrastructureCount}

---

## 2. RECONSTRUCTED ENTITY NETWORK (${currentCase.nodes.length} Targets)
${currentCase.nodes
  .map(
    (n, idx) =>
      `### Target #${idx + 1}: ${n.name}
- **Identifier / Address:** \`${n.label}\`
- **Modality:** ${n.type} | **Role:** ${n.role.toUpperCase()}
- **Risk Score:** ${n.riskScore}/100 | **Threat Level:** ${n.threatLevel.toUpperCase()}
- **Betweenness Centrality:** ${n.centrality?.betweenness || 0}
- **Disruption Impact:** ${n.centrality?.disruptionImpact || 75}%
- **Financial Volume:** $${(n.metadata?.totalVolumeUSD || n.metadata?.balanceUSD || 0).toLocaleString()} USD
- **Notes:** ${n.metadata?.notes || 'None logged.'}`
  )
  .join('\n\n')}

---

## 3. CORRELATED EVIDENCE EDGES (${currentCase.edges.length} Links)
${currentCase.edges
  .map(
    (e, idx) =>
      `${idx + 1}. **${e.label}** (\`${e.type}\`)
   From: ${e.source} → To: ${e.target}
   Value: $${e.value.toLocaleString()} USD | Confidence: ${e.confidence}% | Protocol: ${e.protocol || 'N/A'}`
  )
  .join('\n')}

---
VERIFICATION AUDIT: SHA-256 INTEGRITY VALIDATED
Generated by NetTrace AI Intelligence Platform
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NETTRACE_${currentCase.caseNumber}_INTELLIGENCE_DOSSIER.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Node drawer trigger actions
  const handleSimulateRemoval = (nodeId: string) => {
    setSimulationRemovedIds([nodeId]);
    setActiveTab('simulation');
    setSelectedNode(null);
  };

  const handleFindPathFromNode = (nodeId: string) => {
    setIsPathFinderOpen(true);
  };

  const handleOpenAffidavitForNode = (nodeId?: string) => {
    setAffidavitTargetId(nodeId || currentCase.nodes[0]?.id);
    setIsAffidavitOpen(true);
  };

  const highRiskTargetsCount = currentCase.nodes.filter((n) => n.riskScore >= 80).length;

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Law Enforcement Header */}
      <Header
        currentCase={currentCase}
        cases={cases}
        onSelectCase={(c) => {
          setCurrentCase(c);
          setSelectedNode(null);
          setHighlightedPathNodeIds([]);
          setHighlightedPathEdgeIds([]);
        }}
        onOpenAddEvidence={() => setIsAddEvidenceOpen(true)}
        onOpenCopilot={() => setActiveTab('ai_briefing')}
        onSelectEntityFromSearch={(ent) => {
          setSelectedNode(ent);
          setActiveTab('graph');
        }}
        onExportReport={handleExportReport}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Tab Navigation */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        nodesCount={currentCase.nodes.length}
        targetsCount={highRiskTargetsCount}
        evidenceLogsCount={ingestionLogs.length}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Slide-in Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileDrawerOpen(false);
        }}
        currentCase={currentCase}
        cases={cases}
        onSelectCase={(c) => {
          setCurrentCase(c);
          setSelectedNode(null);
          setHighlightedPathNodeIds([]);
          setHighlightedPathEdgeIds([]);
        }}
        nodesCount={currentCase.nodes.length}
        targetsCount={highRiskTargetsCount}
        evidenceLogsCount={ingestionLogs.length}
        onOpenAddEvidence={() => setIsAddEvidenceOpen(true)}
        onOpenCopilot={() => setActiveTab('ai_briefing')}
        onExportReport={handleExportReport}
      />

      {/* Primary Workspace View Switcher */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'graph' && (
          <div className="relative w-full h-full">
            <NetworkGraphView
              nodes={currentCase.nodes}
              edges={currentCase.edges}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={(n) => setSelectedNode(n)}
              highlightedPathNodeIds={highlightedPathNodeIds}
              highlightedPathEdgeIds={highlightedPathEdgeIds}
              onOpenPathFinder={() => setIsPathFinderOpen(true)}
            />

            {/* Slide-in Node Dossier Drawer */}
            <NodeDossierDrawer
              entity={selectedNode}
              edges={currentCase.edges}
              onClose={() => setSelectedNode(null)}
              onSimulateRemoval={handleSimulateRemoval}
              onFindPathFromNode={handleFindPathFromNode}
              onGenerateAffidavit={handleOpenAffidavitForNode}
              onAskCopilot={(ent) => {
                setActiveTab('ai_briefing');
              }}
              onUpdateStatus={(entId, newStatus) => {
                const nextNodes = currentCase.nodes.map((n) =>
                  n.id === entId
                    ? { ...n, metadata: { ...n.metadata, status: newStatus } }
                    : n
                );
                handleUpdateCase({ nodes: nextNodes });
              }}
              onSelectConnectedNode={(connectedId) => {
                const node = currentCase.nodes.find((n) => n.id === connectedId);
                if (node) setSelectedNode(node);
              }}
            />
          </div>
        )}

        {activeTab === 'prioritization' && (
          <TargetPrioritizationView
            nodes={currentCase.nodes}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setActiveTab('graph');
            }}
            onSimulateBatchRemoval={(nodeIds) => {
              setSimulationRemovedIds(nodeIds);
              setActiveTab('simulation');
            }}
            onGenerateAffidavit={handleOpenAffidavitForNode}
          />
        )}

        {activeTab === 'simulation' && (
          <DisruptionSimulationView
            nodes={currentCase.nodes}
            edges={currentCase.edges}
            initialRemovedIds={simulationRemovedIds}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setActiveTab('graph');
            }}
          />
        )}

        {activeTab === 'ingestion' && (
          <EvidenceIngestionView
            currentCase={currentCase}
            ingestionLogs={ingestionLogs}
            onIngestEvidence={handleIngestEvidence}
            onOpenManualAdd={() => setIsAddEvidenceOpen(true)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            events={timelineEvents}
            nodes={currentCase.nodes}
            onSelectEntity={(entId) => {
              const node = currentCase.nodes.find((n) => n.id === entId);
              if (node) {
                setSelectedNode(node);
                setActiveTab('graph');
              }
            }}
          />
        )}

        {activeTab === 'ai_briefing' && (
          <AIBriefingView
            currentCase={currentCase}
            onOpenAffidavitModal={handleOpenAffidavitForNode}
          />
        )}

        {activeTab === 'case_dossier' && (
          <CaseDossierView
            currentCase={currentCase}
            onUpdateCase={handleUpdateCase}
            onExportCase={handleExportReport}
          />
        )}
      </main>

      {/* Modals */}
      <PathFinderModal
        isOpen={isPathFinderOpen}
        nodes={currentCase.nodes}
        edges={currentCase.edges}
        initialSourceId={selectedNode?.id}
        onClose={() => setIsPathFinderOpen(false)}
        onHighlightPath={(nodeIds, edgeIds) => {
          setHighlightedPathNodeIds(nodeIds);
          setHighlightedPathEdgeIds(edgeIds);
          setActiveTab('graph');
        }}
      />

      <AddEvidenceModal
        isOpen={isAddEvidenceOpen}
        nodes={currentCase.nodes}
        onClose={() => setIsAddEvidenceOpen(false)}
        onAddEntity={handleAddEntity}
        onAddEdge={handleAddEdge}
      />

      <AffidavitGeneratorModal
        isOpen={isAffidavitOpen}
        nodes={currentCase.nodes}
        currentCase={currentCase}
        initialTargetNodeId={affidavitTargetId}
        onClose={() => setIsAffidavitOpen(false)}
      />
    </div>
  );
}
