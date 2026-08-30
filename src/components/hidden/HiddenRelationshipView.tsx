import React, { useState, useEffect, useMemo } from 'react';
import {
  Route,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Network,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Layers,
  Building2,
  User,
  Globe,
  Coins,
  Cpu,
  Server,
  Zap,
  Tag,
  Copy,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Entity,
  EvidenceEdge,
  HiddenRelationshipAnalysisResult,
  HiddenPathResult,
  HiddenPathNode
} from '../../types';
import { api } from '../../services/api';

interface HiddenRelationshipViewProps {
  investigationId: string;
  nodes: Entity[];
  edges: EvidenceEdge[];
  initialSourceId?: string;
  initialTargetId?: string;
  onNavigateToGraph?: (pathNodeIds?: string[], pathEdgeIds?: string[]) => void;
  onNavigateToEvidence?: () => void;
  onNavigateToTimeline?: () => void;
  onSelectEntity?: (entityId: string) => void;
}

export const HiddenRelationshipView: React.FC<HiddenRelationshipViewProps> = ({
  investigationId = 'NX-102',
  nodes,
  edges,
  initialSourceId,
  initialTargetId,
  onNavigateToGraph,
  onNavigateToEvidence,
  onNavigateToTimeline,
  onSelectEntity,
}) => {
  // Selection State
  const [sourceId, setSourceId] = useState<string>(
    initialSourceId ||
      nodes.find((n) => n.label.includes('x-auth-gateway') || n.type === 'DOMAIN' || n.type === 'domain')?.id ||
      nodes[0]?.id ||
      ''
  );

  const [targetId, setTargetId] = useState<string>(
    initialTargetId ||
      nodes.find((n) => n.name.includes('Master Vault') || n.name.includes('Treasury') || n.role === 'kingpin')?.id ||
      nodes[nodes.length - 1]?.id ||
      ''
  );

  const [maxHops, setMaxHops] = useState<number>(6);
  const [sourceSearch, setSourceSearch] = useState<string>('');
  const [targetSearch, setTargetSearch] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState<boolean>(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState<boolean>(false);

  // Data & Analysis State
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<HiddenRelationshipAnalysisResult | null>(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number>(0);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Quick type filter chips
  const typeFilterChips = ['ALL', 'DOMAIN', 'WALLET', 'IP', 'SERVER', 'PERSON', 'EXCHANGE'];

  // Load initial analysis
  useEffect(() => {
    fetchHiddenRelationships(sourceId, targetId, maxHops);
  }, [investigationId]);

  const fetchHiddenRelationships = async (sId?: string, tId?: string, hops: number = 6) => {
    setLoading(true);
    try {
      const data = await api.getHiddenRelationships(investigationId, sId, tId, hops);
      setAnalysisResult(data);
      setSelectedPathIndex(0);
    } catch (err) {
      console.error('Failed to fetch hidden relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = () => {
    if (!sourceId || !targetId) return;
    fetchHiddenRelationships(sourceId, targetId, maxHops);
  };

  const handleSwap = () => {
    const temp = sourceId;
    setSourceId(targetId);
    setTargetId(temp);
    fetchHiddenRelationships(targetId, temp, maxHops);
  };

  const handleClear = () => {
    if (nodes.length >= 2) {
      setSourceId(nodes[0].id);
      setTargetId(nodes[1].id);
      fetchHiddenRelationships(nodes[0].id, nodes[1].id, 6);
    }
  };

  // Filtered Source Node Options
  const filteredSourceNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.id === targetId) return false;
      const matchesSearch =
        n.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        n.label.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        n.type.toLowerCase().includes(sourceSearch.toLowerCase());
      const matchesType =
        sourceTypeFilter === 'ALL' || n.type.toUpperCase() === sourceTypeFilter.toUpperCase();
      return matchesSearch && matchesType;
    });
  }, [nodes, sourceSearch, sourceTypeFilter, targetId]);

  // Filtered Target Node Options
  const filteredTargetNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.id === sourceId) return false;
      const matchesSearch =
        n.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
        n.label.toLowerCase().includes(targetSearch.toLowerCase()) ||
        n.type.toLowerCase().includes(targetSearch.toLowerCase());
      const matchesType =
        targetTypeFilter === 'ALL' || n.type.toUpperCase() === targetTypeFilter.toUpperCase();
      return matchesSearch && matchesType;
    });
  }, [nodes, targetSearch, targetTypeFilter, sourceId]);

  const selectedSourceEntity = nodes.find((n) => n.id === sourceId) || analysisResult?.sourceEntity;
  const selectedTargetEntity = nodes.find((n) => n.id === targetId) || analysisResult?.targetEntity;

  const currentPath: HiddenPathResult | undefined =
    analysisResult?.paths && analysisResult.paths.length > 0
      ? analysisResult.paths[selectedPathIndex] || analysisResult.paths[0]
      : undefined;

  const handleHighlightInGraph = () => {
    if (currentPath && onNavigateToGraph) {
      onNavigateToGraph(currentPath.nodeIds, currentPath.edgeIds);
    }
  };

  const handleCopyInvestigationNote = () => {
    if (!currentPath || !selectedSourceEntity || !selectedTargetEntity) return;
    const note = `[NETTRACE HIDDEN RELATIONSHIP INTEL]
Investigation: ${investigationId}
Source: ${selectedSourceEntity.name} (${selectedSourceEntity.label})
Target: ${selectedTargetEntity.name} (${selectedTargetEntity.label})
Optimal Path: ${currentPath.name} (${currentPath.hops} Hops, Strength: ${currentPath.strength}%, Confidence: ${currentPath.confidence}%)
Path Flow: ${currentPath.nodes.map((n) => n.name).join(' -> ')}
Narrative: ${currentPath.explanation}
Corroborating Evidence: ${currentPath.evidenceCount} item(s)
Classification: CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE`;

    navigator.clipboard.writeText(note);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const getNodeIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('WALLET') || t.includes('CRYPTO')) return Coins;
    if (t.includes('DOMAIN') || t.includes('URL')) return Globe;
    if (t.includes('IP') || t.includes('SERVER')) return Server;
    if (t.includes('PERSON')) return User;
    if (t.includes('EXCHANGE') || t.includes('ORG')) return Building2;
    if (t.includes('TRANSACTION') || t.includes('BLOCKCHAIN')) return Zap;
    return Network;
  };

  const getThreatBadgeClass = (threatLevel?: string, riskScore: number = 50) => {
    if (threatLevel === 'critical' || riskScore >= 80) {
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    }
    if (threatLevel === 'high' || riskScore >= 65) {
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
    if (threatLevel === 'medium' || riskScore >= 40) {
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getIndicatorLevelBadge = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (level === 'HIGH') return 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold';
    if (level === 'MEDIUM') return 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold';
    return 'bg-slate-800 text-slate-400 border border-slate-700';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5 text-slate-100 font-sans">
      {/* 1. Header Title & Active Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Analysis Protocol</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-0.5">
            Hidden Relationship Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Discover indirect paths and potential connections hidden within the investigation network.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-400">ACTIVE CONTEXT:</span>
            <span className="font-semibold text-cyan-300">NX-102 — Phantom Ledger</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards (4 Metrics from Stitch Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Potential Hidden Relationships
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-300 mt-1">
            {analysisResult?.summary.totalHiddenRelationships || 12}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
            <Share2 className="w-3 h-3 text-cyan-400" />
            <span>Indirect Conduits Identified</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            High-Relevance Paths
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
            {analysisResult?.summary.highRelevancePaths || 4}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Strength Score ≥ 75%</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Entities Analyzed
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
            {analysisResult?.summary.entitiesAnalyzed || nodes.length || 36}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Multi-Modal Target Base</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Average Path Length
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
            {analysisResult?.summary.averagePathLength || 3.2}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Hops Between Key Targets</span>
          </div>
        </div>
      </div>

      {/* 3. Parameter Definition Panel (Stitch Image 2 design) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Define Path Parameters
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Max Hop Limit:</span>
            <select
              value={maxHops}
              onChange={(e) => setMaxHops(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-750 text-cyan-300 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="2">2 Hops</option>
              <option value="3">3 Hops</option>
              <option value="4">4 Hops</option>
              <option value="5">5 Hops</option>
              <option value="6">6 Hops (Deep Scan)</option>
            </select>
          </div>
        </div>

        {/* Source & Target Inputs with Swap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Source Entity (IN.01) */}
          <div className="lg:col-span-5 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1">
                <span className="text-cyan-400">IN.01</span> SOURCE ENTITY
              </label>
              {selectedSourceEntity && (
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                  {selectedSourceEntity.type}
                </span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                className="w-full text-left bg-slate-950 hover:bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-xl p-3 flex items-center justify-between transition-all"
              >
                {selectedSourceEntity ? (
                  <div className="flex items-center space-x-2.5 truncate">
                    {React.createElement(getNodeIcon(selectedSourceEntity.type), {
                      className: 'w-4 h-4 text-cyan-400 flex-shrink-0',
                    })}
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 text-xs truncate">
                        {selectedSourceEntity.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {selectedSourceEntity.label}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Select Source Entity...</span>
                )}
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
              </button>

              {/* Source Dropdown Menu */}
              {isSourceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-2 max-h-80 overflow-y-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search origin wallet, domain, IP, actor..."
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-1">
                    {typeFilterChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setSourceTypeFilter(chip)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                          sourceTypeFilter === chip
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
                    {filteredSourceNodes.map((node) => {
                      const IconComp = getNodeIcon(node.type);
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSourceId(node.id);
                            setIsSourceDropdownOpen(false);
                            setSourceSearch('');
                          }}
                          className="w-full text-left p-2 hover:bg-slate-800/80 rounded-lg flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <IconComp className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <div className="truncate">
                              <div className="font-medium text-slate-200 truncate">{node.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">{node.label}</div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ml-2 ${getThreatBadgeClass(
                              node.threatLevel,
                              node.riskScore
                            )}`}
                          >
                            {node.riskScore}/100
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Swap Button (Center) */}
          <div className="lg:col-span-2 flex justify-center py-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 shadow-md transition-all flex items-center space-x-1.5"
              title="Swap Source and Target Entities"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono hidden sm:inline">SWAP</span>
            </button>
          </div>

          {/* Target Entity (OUT.01) */}
          <div className="lg:col-span-5 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1">
                <span className="text-amber-400">OUT.01</span> TARGET ENTITY
              </label>
              {selectedTargetEntity && (
                <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                  {selectedTargetEntity.type}
                </span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                className="w-full text-left bg-slate-950 hover:bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-xl p-3 flex items-center justify-between transition-all"
              >
                {selectedTargetEntity ? (
                  <div className="flex items-center space-x-2.5 truncate">
                    {React.createElement(getNodeIcon(selectedTargetEntity.type), {
                      className: 'w-4 h-4 text-amber-400 flex-shrink-0',
                    })}
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 text-xs truncate">
                        {selectedTargetEntity.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {selectedTargetEntity.label}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Select Target Entity...</span>
                )}
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
              </button>

              {/* Target Dropdown Menu */}
              {isTargetDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-2 max-h-80 overflow-y-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search destination vault, mixer, exchange, actor..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-1">
                    {typeFilterChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setTargetTypeFilter(chip)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                          targetTypeFilter === chip
                            ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
                    {filteredTargetNodes.map((node) => {
                      const IconComp = getNodeIcon(node.type);
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setTargetId(node.id);
                            setIsTargetDropdownOpen(false);
                            setTargetSearch('');
                          }}
                          className="w-full text-left p-2 hover:bg-slate-800/80 rounded-lg flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <IconComp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <div className="truncate">
                              <div className="font-medium text-slate-200 truncate">{node.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">{node.label}</div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ml-2 ${getThreatBadgeClass(
                              node.threatLevel,
                              node.riskScore
                            )}`}
                          >
                            {node.riskScore}/100
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px]">
              Potential relationships are analytical leads based on available evidence and network structure.
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-750 text-slate-300 text-xs font-mono font-semibold transition-all"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={handleRunSearch}
              disabled={loading || !sourceId || !targetId}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>TRACING PATHS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>FIND HIDDEN RELATIONSHIP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Three-Pane Studio Layout (Stitch Image 1 Design) */}
      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* ========================================================================= */}
          {/* LEFT PANE: TARGET MAPPING & ALTERNATIVE PATHS (3 Cols)                    */}
          {/* ========================================================================= */}
          <div className="xl:col-span-3 space-y-3">
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                  Target Mapping
                </span>
                <button
                  onClick={handleSwap}
                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Swap entities"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Source Entity Mini Card */}
              {selectedSourceEntity && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-semibold">
                    <span>SOURCE ENTITY</span>
                    <span className="uppercase">{selectedSourceEntity.type}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 truncate">
                    {selectedSourceEntity.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {selectedSourceEntity.label}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 capitalize">
                      {selectedSourceEntity.role}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getThreatBadgeClass(
                        selectedSourceEntity.threatLevel,
                        selectedSourceEntity.riskScore
                      )}`}
                    >
                      {selectedSourceEntity.riskScore}/100 RISK
                    </span>
                  </div>
                </div>
              )}

              {/* Target Entity Mini Card */}
              {selectedTargetEntity && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-semibold">
                    <span>TARGET ENTITY</span>
                    <span className="uppercase">{selectedTargetEntity.type}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 truncate">
                    {selectedTargetEntity.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {selectedTargetEntity.label}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 capitalize">
                      {selectedTargetEntity.role}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getThreatBadgeClass(
                        selectedTargetEntity.threatLevel,
                        selectedTargetEntity.riskScore
                      )}`}
                    >
                      {selectedTargetEntity.riskScore}/100 RISK
                    </span>
                  </div>
                </div>
              )}

              {/* Direct connection warning note if applicable */}
              {analysisResult.isDirectlyConnected && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-850 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Direct Connection Present:</span> {analysisResult.directRelationshipCount} direct edge(s) exist. Alternative multi-hop obfuscation routes are mapped below.
                  </div>
                </div>
              )}
            </div>

            {/* Alternative Paths Ranked List */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                  Alternative Paths ({analysisResult.paths.length} Found)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Ranked by Lead Strength</span>
              </div>

              {analysisResult.paths.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-slate-400 bg-slate-950 rounded-xl border border-slate-850">
                  No indirect multi-hop conduit paths identified within {maxHops} hops.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisResult.paths.map((path, idx) => {
                    const isSelected = idx === selectedPathIndex;
                    return (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => setSelectedPathIndex(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                            : 'bg-slate-950 hover:bg-slate-850/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`font-bold font-mono ${
                                isSelected ? 'text-cyan-300' : 'text-slate-200'
                              }`}
                            >
                              {path.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              path.strength >= 80
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                          >
                            {path.strength}% STR
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                          <span>{path.hops} Hops</span>
                          <span className="text-slate-400 font-semibold">{path.tag}</span>
                        </div>

                        {/* Visual Path Flow summary */}
                        <div className="mt-2 text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
                          {path.nodes.map((n, nIdx) => (
                            <React.Fragment key={n.id}>
                              <span
                                className={`truncate max-w-[70px] ${
                                  nIdx === 0
                                    ? 'text-cyan-400 font-bold'
                                    : nIdx === path.nodes.length - 1
                                    ? 'text-amber-400 font-bold'
                                    : 'text-slate-300'
                                }`}
                              >
                                {n.name.split(' ')[0]}
                              </span>
                              {nIdx < path.nodes.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTER PANE: ACTIVE PATH ANALYSIS DIAGRAM (6 Cols)                        */}
          {/* ========================================================================= */}
          <div className="xl:col-span-6 space-y-3">
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              {/* Diagram Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono uppercase font-bold text-cyan-300">
                    Active Path Analysis
                  </div>
                  {currentPath && (
                    <span className="text-xs font-mono text-slate-400">
                      {currentPath.hops} Hops // {currentPath.strength}% Strength
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.1, 1.4))}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 0.1, 0.7))}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleHighlightInGraph}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold flex items-center space-x-1 shadow-md"
                    title="Highlight path in Network Graph Studio"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View in Graph</span>
                  </button>
                </div>
              </div>

              {/* Interactive Path Flow Chain */}
              {currentPath ? (
                <div
                  className="bg-slate-950 rounded-xl p-4 sm:p-6 border border-slate-850 min-h-[380px] flex flex-col justify-center overflow-x-auto transition-transform"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                  <div className="space-y-4">
                    {currentPath.nodes.map((node, idx) => {
                      const IconComp = getNodeIcon(node.type);
                      const isSource = idx === 0;
                      const isTarget = idx === currentPath.nodes.length - 1;
                      const nextEdge = currentPath.edges[idx];

                      return (
                        <div key={node.id} className="space-y-3">
                          {/* Node Card */}
                          <div
                            onClick={() => onSelectEntity && onSelectEntity(node.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSource
                                ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/30 hover:border-cyan-400'
                                : isTarget
                                ? 'bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/30 hover:border-amber-400'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-3 truncate">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isSource
                                      ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                                      : isTarget
                                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs text-slate-100 truncate">
                                      {node.name}
                                    </span>
                                    {isSource && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                                        ENTRY
                                      </span>
                                    )}
                                    {isTarget && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                                        TARGET
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                    {node.label}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                  {node.role}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getThreatBadgeClass(
                                    node.threatLevel,
                                    node.riskScore
                                  )}`}
                                >
                                  {node.riskScore}/100
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Edge Connector Between Nodes */}
                          {nextEdge && (
                            <div className="flex flex-col items-center justify-center py-1">
                              <div className="w-0.5 h-3 bg-cyan-500/40" />
                              <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-750 text-[10px] font-mono flex items-center space-x-2 text-slate-300 shadow-sm">
                                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="font-semibold text-cyan-300">{nextEdge.type}</span>
                                {nextEdge.value ? (
                                  <span className="text-emerald-400 font-bold">
                                    ${Number(nextEdge.value).toLocaleString()}
                                  </span>
                                ) : null}
                                {nextEdge.protocol ? (
                                  <span className="text-slate-400">({nextEdge.protocol})</span>
                                ) : null}
                                <span className="text-slate-400 font-semibold">{nextEdge.confidence}% CONF</span>
                              </div>
                              <div className="w-0.5 h-3 bg-cyan-500/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="min-h-[350px] flex items-center justify-center text-slate-400 font-mono text-xs">
                  No active path selected.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANE: PATH INTELLIGENCE & INVESTIGATIVE ACTIONS (3 Cols)            */}
          {/* ========================================================================= */}
          <div className="xl:col-span-3 space-y-3">
            {currentPath ? (
              <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                {/* Header Badge */}
                <div className="border-b border-slate-800 pb-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    Path Intelligence
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                    Potential Hidden Relationship
                  </h3>
                </div>

                {/* Length & Confidence Stats */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Length</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {currentPath.hops} Hops
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {currentPath.confidence}%
                    </div>
                  </div>
                </div>

                {/* Intelligence Narrative */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-1.5 text-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>Deduction Narrative</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {currentPath.explanation}
                  </p>
                </div>

                {/* Contributing Indicators */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Contributing Indicators
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-slate-300">Evidence-supported</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md ${getIndicatorLevelBadge(
                          currentPath.indicators.evidenceSupported.level
                        )}`}
                      >
                        {currentPath.indicators.evidenceSupported.level}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-slate-300">Temporal proximity</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md ${getIndicatorLevelBadge(
                          currentPath.indicators.temporalProximity.level
                        )}`}
                      >
                        {currentPath.indicators.temporalProximity.level}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-slate-300">Shared infrastructure</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md ${getIndicatorLevelBadge(
                          currentPath.indicators.sharedInfrastructure.level
                        )}`}
                      >
                        {currentPath.indicators.sharedInfrastructure.level}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                      <span className="text-slate-300">Cross-domain bridging</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md ${getIndicatorLevelBadge(
                          currentPath.indicators.crossDomainBridging.level
                        )}`}
                      >
                        {currentPath.indicators.crossDomainBridging.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Investigative Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Investigative Actions
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={onNavigateToEvidence}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Evidence</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHighlightInGraph}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Network className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Network</span>
                    </button>

                    <button
                      type="button"
                      onClick={onNavigateToTimeline}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Timeline</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyInvestigationNote}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      {copiedNote ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Add Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Compliance / Evidentiary Disclaimer */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-[10px] text-slate-400 leading-relaxed font-mono">
                  {analysisResult.disclaimer}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center text-slate-400 font-mono text-xs">
                Select an alternative path to inspect intelligence indicators.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
