import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Filter, 
  Layers, 
  Sliders, 
  Eye, 
  EyeOff, 
  Route, 
  DollarSign, 
  ShieldAlert, 
  Play, 
  Pause,
  Server,
  Globe,
  Coins,
  Cpu,
  User,
  Building2,
  Phone,
  Mail,
  Zap,
  Boxes
} from 'lucide-react';
import { Entity, EvidenceEdge, EntityType, ThreatLevel } from '../../types';

interface NetworkGraphViewProps {
  nodes: Entity[];
  edges: EvidenceEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: Entity | null) => void;
  highlightedPathNodeIds?: string[];
  highlightedPathEdgeIds?: string[];
  onOpenPathFinder: () => void;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  highlightedPathNodeIds = [],
  highlightedPathEdgeIds = [],
  onOpenPathFinder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout & View State
  const [layoutMode, setLayoutMode] = useState<'force' | 'circular' | 'hierarchical'>('force');
  const [viewPreset, setViewPreset] = useState<'all' | 'financial' | 'infrastructure' | 'identity'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filters State - default to all possible entity types (uppercase & lowercase)
  const allInitialTypes = new Set<string>([
    'WALLET', 'crypto_wallet',
    'TRANSACTION', 'transaction',
    'EXCHANGE', 'crypto_exchange',
    'BLOCKCHAIN', 'blockchain',
    'DOMAIN', 'domain',
    'IP', 'ip_address',
    'DEVICE', 'device',
    'SERVER', 'server',
    'PERSON', 'person',
    'EMAIL', 'email',
    'PHONE', 'phone',
    'ORGANIZATION', 'organization',
    'bank_account',
  ]);

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(allInitialTypes);
  const [minRiskScore, setMinRiskScore] = useState<number>(0);
  const [threatLevels, setThreatLevels] = useState<Set<ThreatLevel>>(
    new Set(['critical', 'high', 'medium', 'low', 'neutral'])
  );
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);
  const [showCentralityRings, setShowCentralityRings] = useState<boolean>(true);
  const [isSimulationPaused, setIsSimulationPaused] = useState<boolean>(false);

  // Preset switchers
  const applyPreset = (preset: 'all' | 'financial' | 'infrastructure' | 'identity') => {
    setViewPreset(preset);
    if (preset === 'all') {
      setSelectedTypes(new Set(allInitialTypes));
    } else if (preset === 'financial') {
      setSelectedTypes(new Set([
        'WALLET', 'crypto_wallet',
        'TRANSACTION', 'transaction',
        'EXCHANGE', 'crypto_exchange',
        'BLOCKCHAIN', 'blockchain',
        'bank_account'
      ]));
    } else if (preset === 'infrastructure') {
      setSelectedTypes(new Set([
        'DOMAIN', 'domain',
        'IP', 'ip_address',
        'DEVICE', 'device',
        'SERVER', 'server'
      ]));
    } else if (preset === 'identity') {
      setSelectedTypes(new Set([
        'PERSON', 'person',
        'EMAIL', 'email',
        'PHONE', 'phone',
        'ORGANIZATION', 'organization'
      ]));
    }
  };

  // Filtered Nodes & Edges
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (n) =>
        selectedTypes.has(n.type) &&
        (threatLevels.has(n.threatLevel) || (n.threatLevel === 'neutral' && threatLevels.has('low'))) &&
        n.riskScore >= minRiskScore
    );
  }, [nodes, selectedTypes, threatLevels, minRiskScore]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return edges.filter((e) => {
      const sourceId = typeof e.source === 'object' && e.source !== null ? (e.source as any).id : e.source;
      const targetId = typeof e.target === 'object' && e.target !== null ? (e.target as any).id : e.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
  }, [edges, filteredNodeIds]);

  // D3 Force Simulation Nodes & Links
  const [simNodes, setSimNodes] = useState<any[]>([]);
  const [simLinks, setSimLinks] = useState<any[]>([]);
  const [draggedNode, setDraggedNode] = useState<any | null>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  // Initialize D3 Force Simulation
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    // Clone data for simulation
    const simulationNodes = filteredNodes.map((n) => ({
      ...n,
      x: n.x || width / 2 + (Math.random() - 0.5) * 450,
      y: n.y || height / 2 + (Math.random() - 0.5) * 450,
    }));

    const simulationLinks = filteredEdges.map((e) => ({
      ...e,
      source: typeof e.source === 'object' && e.source !== null ? (e.source as any).id : e.source,
      target: typeof e.target === 'object' && e.target !== null ? (e.target as any).id : e.target,
    }));

    if (layoutMode === 'force') {
      const sim = d3
        .forceSimulation(simulationNodes)
        .force(
          'link',
          d3
            .forceLink(simulationLinks)
            .id((d: any) => d.id)
            .distance((d: any) => {
              if (d.type === 'TRANSFERRED_TO' || d.type === 'financial_transaction') return 130;
              if (d.type === 'RECORDED_ON') return 90;
              return 110;
            })
            .strength(0.65)
        )
        .force('charge', d3.forceManyBody().strength(-420))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.75))
        .force('collision', d3.forceCollide().radius(48))
        .on('tick', () => {
          setSimNodes([...simulationNodes]);
          setSimLinks([...simulationLinks]);
        });

      simulationRef.current = sim;

      return () => {
        sim.stop();
      };
    } else if (layoutMode === 'circular') {
      const radius = Math.min(width, height) * 0.38;
      const angleStep = (2 * Math.PI) / (simulationNodes.length || 1);

      simulationNodes.forEach((n, idx) => {
        n.x = width / 2 + radius * Math.cos(idx * angleStep);
        n.y = height / 2 + radius * Math.sin(idx * angleStep);
      });

      setSimNodes(simulationNodes);
      setSimLinks(simulationLinks);
    } else if (layoutMode === 'hierarchical') {
      // Group by role / layer hierarchy
      const roleRanks: Record<string, number> = {
        kingpin: 1,
        developer: 1,
        facilitator: 2,
        c2_controller: 2,
        money_launderer: 2,
        infrastructure_provider: 3,
        mule: 4,
        victim: 4,
        unknown: 4,
      };

      const groups: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
      simulationNodes.forEach((n) => {
        const rank = roleRanks[n.role] || 4;
        groups[rank].push(n);
      });

      const layerHeight = height / 5;
      Object.entries(groups).forEach(([rankStr, grpNodes]) => {
        const rank = Number(rankStr);
        const y = rank * layerHeight;
        const xStep = width / (grpNodes.length + 1);
        grpNodes.forEach((n, idx) => {
          n.x = (idx + 1) * xStep;
          n.y = y;
        });
      });

      setSimNodes(simulationNodes);
      setSimLinks(simulationLinks);
    }
  }, [filteredNodes, filteredEdges, layoutMode]);

  // Center Graph on Reset
  const handleResetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    if (simulationRef.current) {
      simulationRef.current.alpha(0.8).restart();
    }
  };

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: any) => {
    e.stopPropagation();
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
      setDraggedNode(node);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const mouseY = (e.clientY - rect.top - pan.y) / zoomLevel;
      draggedNode.fx = mouseX;
      draggedNode.fy = mouseY;
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoomLevel * zoomDelta, 0.3), 3.5);
    setZoomLevel(newZoom);
  };

  // Node Type Colors, Icons and Categories
  const getTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'wallet' || t === 'crypto_wallet') {
      return { label: 'WALLET', color: '#f59e0b', bg: '#451a03', category: 'Blockchain / Financial' };
    }
    if (t === 'transaction') {
      return { label: 'TX', color: '#10b981', bg: '#064e3b', category: 'Blockchain / Financial' };
    }
    if (t === 'exchange' || t === 'crypto_exchange') {
      return { label: 'EXCHANGE', color: '#06b6d4', bg: '#083344', category: 'Blockchain / Financial' };
    }
    if (t === 'blockchain') {
      return { label: 'CHAIN', color: '#8b5cf6', bg: '#2e1065', category: 'Blockchain / Financial' };
    }
    if (t === 'ip' || t === 'ip_address') {
      return { label: 'IP', color: '#a855f7', bg: '#3b0764', category: 'Cyber Infrastructure' };
    }
    if (t === 'domain') {
      return { label: 'DOMAIN', color: '#ec4899', bg: '#500724', category: 'Cyber Infrastructure' };
    }
    if (t === 'device') {
      return { label: 'DEVICE', color: '#f43f5e', bg: '#4c0519', category: 'Cyber Infrastructure' };
    }
    if (t === 'server') {
      return { label: 'SERVER', color: '#ef4444', bg: '#450a0a', category: 'Cyber Infrastructure' };
    }
    if (t === 'person') {
      return { label: 'PERSON', color: '#10b981', bg: '#022c22', category: 'Identity / Communication' };
    }
    if (t === 'email') {
      return { label: 'EMAIL', color: '#38bdf8', bg: '#075985', category: 'Identity / Communication' };
    }
    if (t === 'phone') {
      return { label: 'PHONE', color: '#f97316', bg: '#431407', category: 'Identity / Communication' };
    }
    if (t === 'organization' || t === 'bank_account') {
      return { label: 'CORP', color: '#14b8a6', bg: '#134e4a', category: 'Identity / Communication' };
    }
    return { label: 'NODE', color: '#94a3b8', bg: '#0f172a', category: 'Other' };
  };

  const getThreatColor = (threat: string) => {
    switch ((threat || '').toLowerCase()) {
      case 'critical':
        return '#f43f5e';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#10b981';
      case 'neutral':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-140px)] min-h-[550px] bg-[#070c18] overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Radar Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.18) 0%, transparent 65%),
            linear-gradient(to right, rgba(30, 41, 59, 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(30, 41, 59, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Top Left: Graph Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
        {/* Layer Presets */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => applyPreset('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              viewPreset === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="All 3-Layer Integrated Graph"
          >
            All Layers
          </button>
          <button
            onClick={() => applyPreset('financial')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              viewPreset === 'financial'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Blockchain & Financial Flow"
          >
            Financial Flow
          </button>
          <button
            onClick={() => applyPreset('infrastructure')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              viewPreset === 'infrastructure'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cyber Infrastructure & C2"
          >
            Cyber Infra
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Layout Modes */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setLayoutMode('force')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              layoutMode === 'force' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'
            }`}
          >
            Force
          </button>
          <button
            onClick={() => setLayoutMode('circular')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              layoutMode === 'circular' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'
            }`}
          >
            Ring
          </button>
          <button
            onClick={() => setLayoutMode('hierarchical')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              layoutMode === 'hierarchical' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'
            }`}
          >
            Hierarchy
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 3.0))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.4))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Reset View & Recalibrate"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800" />

        {/* Path Finder Action */}
        <button
          onClick={onOpenPathFinder}
          className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Path Finder</span>
        </button>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFiltersPanel((v) => !v)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            showFiltersPanel
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          <span className="ml-1 px-1.5 py-0.2 bg-slate-800 rounded-full text-[10px] text-slate-300">
            {filteredNodes.length}/{nodes.length}
          </span>
        </button>
      </div>

      {/* Top Right: Status & Legend Pill */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="px-2.5 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 flex items-center space-x-1.5 shadow-lg"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showLegend ? 'Hide Legend' : 'Show Legend'}</span>
        </button>
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>34 Active Entities</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">$42.85M Monitored</span>
        </div>
      </div>

      {/* Semantic Legend Overlay (Right Top) */}
      {showLegend && (
        <div className="absolute top-16 right-4 z-20 w-64 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              Graph Ontology
            </span>
            <span className="text-[10px] text-slate-400 font-mono">3 Layers</span>
          </div>

          {/* Blockchain & Financial */}
          <div>
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mb-1">
              <Coins className="w-3 h-3" /> Blockchain & Financial
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Wallet Vault
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Transaction
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" /> Exchange
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Blockchain
              </div>
            </div>
          </div>

          {/* Cyber Infrastructure */}
          <div>
            <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3" /> Cyber Infrastructure
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" /> Phish Domain
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" /> C2 Server IP
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> Author Device
              </div>
            </div>
          </div>

          {/* Identity & Legal */}
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1">
              <User className="w-3 h-3" /> Identity & Corporate
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Subject/Mule
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" /> Corp Shell/Desk
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Email Registrant
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> Burner Phone
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Filter Drawer */}
      {showFiltersPanel && (
        <div className="absolute top-16 left-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Graph Display Controls
            </span>
            <button
              onClick={() => {
                setSelectedTypes(new Set(allInitialTypes));
                setMinRiskScore(0);
                setThreatLevels(new Set(['critical', 'high', 'medium', 'low', 'neutral']));
              }}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Quick Visibility Toggles */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setShowLabels((v) => !v)}
              className={`px-2 py-1.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                showLabels ? 'bg-slate-800 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-850 text-slate-400'
              }`}
            >
              <span>Labels</span>
              {showLabels ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>
            <button
              onClick={() => setShowFlowAnimation((v) => !v)}
              className={`px-2 py-1.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                showFlowAnimation ? 'bg-slate-800 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-850 text-slate-400'
              }`}
            >
              <span>Tx Flow FX</span>
              <Zap className={`w-3 h-3 ${showFlowAnimation ? 'text-amber-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* Threat Level Filter */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Threat Level Filter</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(['critical', 'high', 'medium', 'low', 'neutral'] as ThreatLevel[]).map((level) => {
                const isSelected = threatLevels.has(level);
                return (
                  <button
                    key={level}
                    onClick={() => {
                      const next = new Set(threatLevels);
                      if (next.has(level)) next.delete(level);
                      else next.add(level);
                      setThreatLevels(next);
                    }}
                    className={`px-2 py-1 rounded text-left flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-slate-600 text-slate-200'
                        : 'bg-slate-950/60 border-slate-850 text-slate-500'
                    }`}
                  >
                    <span className="capitalize">{level}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getThreatColor(level) }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Risk Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
              <span>Min Risk Score</span>
              <span className="text-cyan-400 font-mono">{minRiskScore} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minRiskScore}
              onChange={(e) => setMinRiskScore(Number(e.target.value))}
              className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Entity Modalities Selection */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Entity Modalities (12 Types)</div>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {[
                { type: 'WALLET', label: 'Wallet Vault' },
                { type: 'TRANSACTION', label: 'Transaction' },
                { type: 'EXCHANGE', label: 'Exchange' },
                { type: 'BLOCKCHAIN', label: 'Blockchain' },
                { type: 'DOMAIN', label: 'Domain' },
                { type: 'IP', label: 'IP Address' },
                { type: 'DEVICE', label: 'Dev Device' },
                { type: 'PERSON', label: 'Person / Mule' },
                { type: 'EMAIL', label: 'Email Whois' },
                { type: 'PHONE', label: 'Phone Burner' },
                { type: 'ORGANIZATION', label: 'Corp / Desk' },
              ].map(({ type, label }) => {
                const isSelected = selectedTypes.has(type);
                const badge = getTypeBadge(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      const next = new Set(selectedTypes);
                      if (next.has(type)) {
                        next.delete(type);
                        next.delete(type.toLowerCase());
                      } else {
                        next.add(type);
                        next.add(type.toLowerCase());
                      }
                      setSelectedTypes(next);
                    }}
                    className={`px-2 py-1 rounded text-left text-[11px] font-mono flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-slate-600 text-slate-200'
                        : 'bg-slate-950/60 border-slate-850 text-slate-500'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: badge.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas for Network Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Directional Arrow Marker */}
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
          </marker>
          <marker
            id="arrowhead-gold"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
          </marker>

          {/* Node Glow Filters */}
          <filter id="glow-critical" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoomLevel})`}>
          {/* Render Edges */}
          {simLinks.map((edge) => {
            const sourceId = typeof edge.source === 'object' && edge.source !== null ? edge.source.id : edge.source;
            const targetId = typeof edge.target === 'object' && edge.target !== null ? edge.target.id : edge.target;
            const sourceNode = simNodes.find((n) => n.id === sourceId) || (typeof edge.source === 'object' ? edge.source : null);
            const targetNode = simNodes.find((n) => n.id === targetId) || (typeof edge.target === 'object' ? edge.target : null);
            if (!sourceNode || !targetNode || sourceNode.x === undefined || targetNode.x === undefined) return null;

            const isHighlighted = highlightedPathEdgeIds.includes(edge.id);
            const isConnectedToSelected =
              selectedNodeId &&
              (sourceNode.id === selectedNodeId || targetNode.id === selectedNodeId);

            const isTxEdge = edge.type === 'TRANSFERRED_TO' || edge.type === 'financial_transaction' || edge.value > 0;

            const strokeColor = isHighlighted
              ? '#fbbf24'
              : isConnectedToSelected
              ? '#38bdf8'
              : isTxEdge
              ? '#06b6d4'
              : edge.type === 'RECORDED_ON'
              ? '#8b5cf6'
              : edge.type === 'COMMUNICATED_WITH' || edge.type === 'communication'
              ? '#10b981'
              : '#475569';

            const strokeWidth = isHighlighted ? 3.5 : isConnectedToSelected ? 2.5 : isTxEdge ? 2.0 : 1.4;
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g key={edge.id} className="transition-all duration-300">
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={isHighlighted ? 1 : isConnectedToSelected ? 0.95 : 0.6}
                  strokeDasharray={
                    showFlowAnimation && isTxEdge
                      ? '6,4'
                      : edge.type === 'RECORDED_ON'
                      ? '3,3'
                      : undefined
                  }
                  markerEnd={isHighlighted ? 'url(#arrowhead-gold)' : 'url(#arrowhead)'}
                >
                  <title>{`${edge.label || edge.type}${edge.value ? ` ($${edge.value.toLocaleString()})` : ''} - Confidence: ${edge.confidence || 85}%`}</title>
                </line>

                {/* Edge Label for Transactions / Values */}
                {edge.value > 100 && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-32"
                      y="-8"
                      width="64"
                      height="16"
                      rx="4"
                      fill="#020617"
                      stroke={isHighlighted ? '#fbbf24' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={isHighlighted ? '#fbbf24' : '#38bdf8'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ${(edge.value / 1000000 >= 1
                        ? `${(edge.value / 1000000).toFixed(1)}M`
                        : `${(edge.value / 1000).toFixed(0)}k`)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {simNodes.map((node) => {
            if (!node.x || !node.y) return null;
            const isSelected = selectedNodeId === node.id;
            const isPathNode = highlightedPathNodeIds.includes(node.id);
            const badge = getTypeBadge(node.type);
            const threatColor = getThreatColor(node.threatLevel);

            // Radius based on centrality betweenness / degree
            const radius = 18 + (node.centrality?.betweenness || 0) * 14;

            const isTxNode = (node.type || '').toUpperCase() === 'TRANSACTION';
            const isChainNode = (node.type || '').toUpperCase() === 'BLOCKCHAIN';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Outer Centrality Pulsing Ring */}
                {showCentralityRings && (
                  <circle
                    r={radius + 7}
                    fill="none"
                    stroke={threatColor}
                    strokeWidth="1.5"
                    strokeOpacity={isSelected ? 0.9 : 0.35}
                    strokeDasharray={node.role === 'kingpin' ? '3,3' : undefined}
                    className={isSelected ? 'animate-spin-slow' : undefined}
                  />
                )}

                {/* Selection Aura */}
                {isSelected && (
                  <circle
                    r={radius + 14}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Main Body: Diamond for Transaction, Hexagonal for Blockchain, Circle for others */}
                {isTxNode ? (
                  <rect
                    x={-radius * 0.9}
                    y={-radius * 0.9}
                    width={radius * 1.8}
                    height={radius * 1.8}
                    transform="rotate(45)"
                    fill="#062e24"
                    stroke={isSelected ? '#38bdf8' : isPathNode ? '#fbbf24' : '#10b981'}
                    strokeWidth={isSelected ? 3 : 2}
                    rx={4}
                  />
                ) : isChainNode ? (
                  <rect
                    x={-radius * 1.1}
                    y={-radius * 0.8}
                    width={radius * 2.2}
                    height={radius * 1.6}
                    fill="#1e1035"
                    stroke={isSelected ? '#38bdf8' : '#8b5cf6'}
                    strokeWidth={isSelected ? 3 : 2}
                    rx={6}
                  />
                ) : (
                  <circle
                    r={radius}
                    fill="#0b1329"
                    stroke={isSelected ? '#38bdf8' : isPathNode ? '#fbbf24' : threatColor}
                    strokeWidth={isSelected ? 3 : isPathNode ? 3 : 2}
                    filter={node.threatLevel === 'critical' ? 'url(#glow-critical)' : undefined}
                  />
                )}

                {/* Inner Role / Modality Monogram */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {badge.label.slice(0, 3)}
                </text>

                {/* Role Badge Pill on Top */}
                {node.role && node.role !== 'unknown' && (
                  <g transform={`translate(0, ${-radius - 7})`}>
                    <rect
                      x="-28"
                      y="-7"
                      width="56"
                      height="13"
                      rx="3"
                      fill={node.role === 'kingpin' ? '#881337' : '#0f172a'}
                      stroke={node.role === 'kingpin' ? '#f43f5e' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="2.5"
                      fill={node.role === 'kingpin' ? '#fda4af' : '#94a3b8'}
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {(node.role || '').toUpperCase()}
                    </text>
                  </g>
                )}

                {/* Node Label Below */}
                {showLabels && (
                  <g transform={`translate(0, ${radius + 12})`}>
                    <rect
                      x={-Math.min(75, (node.name.length * 5) / 2 + 6)}
                      y="-6"
                      width={Math.min(150, node.name.length * 5 + 12)}
                      height="24"
                      rx="4"
                      fill="#020617"
                      fillOpacity="0.88"
                      stroke="#1e293b"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="14"
                      fill="#64748b"
                      fontSize="7.5"
                      fontFamily="monospace"
                    >
                      {node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
