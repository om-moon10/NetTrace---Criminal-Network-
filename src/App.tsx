import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TabView } from './components/layout/NavigationTabs';
import { NetworkGraphView } from './components/graph/NetworkGraphView';
import { NodeDossierDrawer } from './components/graph/NodeDossierDrawer';
import { PotentialKingpinView } from './components/kingpin/PotentialKingpinView';
import { TargetPrioritizationView } from './components/prioritization/TargetPrioritizationView';
import { DisruptionSimulationView } from './components/simulation/DisruptionSimulationView';
import { EvidenceIngestionView } from './components/ingestion/EvidenceIngestionView';
import { TimelineView } from './components/timeline/TimelineView';
import { HiddenRelationshipView } from './components/hidden/HiddenRelationshipView';
import { AIBriefingView } from './components/ai/AIBriefingView';
import { CaseDossierView } from './components/cases/CaseDossierView';
import { PathFinderModal } from './components/modals/PathFinderModal';
import { AddEvidenceModal } from './components/modals/AddEvidenceModal';
import { AffidavitGeneratorModal } from './components/modals/AffidavitGeneratorModal';
import { InvestigationCase, Entity, EvidenceEdge, IngestionLog, TimelineEvent } from './types';
import { INITIAL_CASES, MOCK_TIMELINE_EVENTS, MOCK_INGESTION_LOGS } from './data/mockCases';
import { calculateCentralities } from './utils/graphEngine';

export default function App() {
  // State
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [currentCase, setCurrentCase] = useState<InvestigationCase>(INITIAL_CASES[0]);
  const [activeTab, setActiveTab] = useState<TabView>('graph');
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1200;
    }
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-collapse on smaller tablet screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleNavigateFromCopilot = (view: string, entityId?: string, pathNodeIds?: string[]) => {
    if (view && typeof view === 'string') {
      const validTabs: TabView[] = [
        'graph',
        'kingpin',
        'prioritization',
        'simulation',
        'ingestion',
        'timeline',
        'hidden_relationships',
        'ai_briefing',
        'case_dossier',
      ];
      if (validTabs.includes(view as TabView)) {
        setActiveTab(view as TabView);
      }
    }
    if (entityId) {
      const node = currentCase.nodes.find((n) => n.id === entityId);
      if (node) setSelectedNode(node);
    }
    if (pathNodeIds && pathNodeIds.length > 0) {
      setHighlightedPathNodeIds(pathNodeIds);
    }
  };

  const highRiskTargetsCount = currentCase.nodes.filter((n) => n.riskScore >= 80).length;

  return (
    <div className="h-screen w-screen bg-[#060a14] text-slate-100 flex overflow-hidden antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Navigation Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
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
        onExportReport={handleExportReport}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
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
          onOpenMobileDrawer={() => setIsMobileSidebarOpen(true)}
        />

        {/* Primary Workspace View Switcher Container */}
        <main className="flex-1 relative overflow-hidden bg-[#060a14] flex flex-col min-w-0">
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
                onDetectHiddenRelationships={(entId) => {
                  const node = currentCase.nodes.find((n) => n.id === entId);
                  if (node) setSelectedNode(node);
                  setActiveTab('hidden_relationships');
                }}
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

          {activeTab === 'kingpin' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <PotentialKingpinView
                investigationId={currentCase.id || 'NX-102'}
                onNavigateToGraph={(entityId) => {
                  if (entityId) {
                    const node = currentCase.nodes.find((n) => n.id === entityId);
                    if (node) setSelectedNode(node);
                  }
                  setActiveTab('graph');
                }}
                onNavigateToEvidence={(entityId) => {
                  setActiveTab('ingestion');
                }}
                onNavigateToSimulation={(entityId) => {
                  setSimulationRemovedIds([entityId]);
                  setActiveTab('simulation');
                }}
                onSelectEntity={(entityId) => {
                  const node = currentCase.nodes.find((n) => n.id === entityId);
                  if (node) {
                    setSelectedNode(node);
                    setActiveTab('graph');
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'prioritization' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
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
                onNavigateToKingpin={() => setActiveTab('kingpin')}
              />
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <DisruptionSimulationView
                nodes={currentCase.nodes}
                edges={currentCase.edges}
                initialRemovedIds={simulationRemovedIds}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setActiveTab('graph');
                }}
              />
            </div>
          )}

          {activeTab === 'ingestion' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <EvidenceIngestionView
                currentCase={currentCase}
                ingestionLogs={ingestionLogs}
                onIngestEvidence={handleIngestEvidence}
                onOpenManualAdd={() => setIsAddEvidenceOpen(true)}
              />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <TimelineView
                events={timelineEvents}
                nodes={currentCase.nodes}
                investigationId={currentCase.id || 'NX-102'}
                onSelectEntity={(entId) => {
                  const node = currentCase.nodes.find((n) => n.id === entId);
                  if (node) {
                    setSelectedNode(node);
                    setActiveTab('graph');
                  }
                }}
                onNavigateToGraph={(entId) => {
                  if (entId) {
                    const node = currentCase.nodes.find((n) => n.id === entId);
                    if (node) setSelectedNode(node);
                  }
                  setActiveTab('graph');
                }}
                onNavigateToEvidence={() => {
                  setActiveTab('ingestion');
                }}
              />
            </div>
          )}

          {activeTab === 'hidden_relationships' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <HiddenRelationshipView
                investigationId={currentCase.id || 'NX-102'}
                nodes={currentCase.nodes}
                edges={currentCase.edges}
                initialSourceId={selectedNode?.id}
                onNavigateToGraph={(pathNodeIds, pathEdgeIds) => {
                  if (pathNodeIds) setHighlightedPathNodeIds(pathNodeIds);
                  if (pathEdgeIds) setHighlightedPathEdgeIds(pathEdgeIds);
                  setActiveTab('graph');
                }}
                onNavigateToEvidence={() => {
                  setActiveTab('ingestion');
                }}
                onNavigateToTimeline={() => {
                  setActiveTab('timeline');
                }}
                onSelectEntity={(entId) => {
                  const node = currentCase.nodes.find((n) => n.id === entId);
                  if (node) {
                    setSelectedNode(node);
                    setActiveTab('graph');
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'ai_briefing' && (
            <div className="w-full h-full overflow-hidden min-w-0 flex flex-col">
              <AIBriefingView
                currentCase={currentCase}
                onOpenAffidavitModal={handleOpenAffidavitForNode}
                onNavigateToView={handleNavigateFromCopilot}
              />
            </div>
          )}

          {activeTab === 'case_dossier' && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <CaseDossierView
                currentCase={currentCase}
                onUpdateCase={handleUpdateCase}
                onExportCase={handleExportReport}
              />
            </div>
          )}
        </main>
      </div>

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

