import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Scissors, 
  Sliders, 
  Layers, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  Target
} from 'lucide-react';
import { Entity, EvidenceEdge, DisruptionSimulationResult } from '../../types';
import { simulateDisruption } from '../../utils/graphEngine';

interface DisruptionSimulationViewProps {
  nodes: Entity[];
  edges: EvidenceEdge[];
  initialRemovedIds?: string[];
  onSelectNode: (node: Entity) => void;
}

export const DisruptionSimulationView: React.FC<DisruptionSimulationViewProps> = ({
  nodes,
  edges,
  initialRemovedIds = [],
  onSelectNode,
}) => {
  const [removedNodeIds, setRemovedNodeIds] = useState<string[]>(initialRemovedIds);
  const [simulationResult, setSimulationResult] = useState<DisruptionSimulationResult | null>(null);

  // Re-run simulation when removed IDs change
  useEffect(() => {
    const result = simulateDisruption(nodes, edges, removedNodeIds);
    setSimulationResult(result);
  }, [nodes, edges, removedNodeIds]);

  const toggleNodeRemoval = (id: string) => {
    if (removedNodeIds.includes(id)) {
      setRemovedNodeIds(removedNodeIds.filter((item) => item !== id));
    } else {
      setRemovedNodeIds([...removedNodeIds, id]);
    }
  };

  const applyPreset = (presetType: 'bottlenecks' | 'c2' | 'kingpins' | 'fiat') => {
    if (presetType === 'bottlenecks') {
      // Find top 2 betweenness nodes
      const topB = [...nodes]
        .sort((a, b) => (b.centrality?.betweenness || 0) - (a.centrality?.betweenness || 0))
        .slice(0, 2)
        .map((n) => n.id);
      setRemovedNodeIds(topB);
    } else if (presetType === 'c2') {
      const c2Nodes = nodes
        .filter((n) => n.role === 'c2_controller' || n.type === 'server' || n.type === 'domain')
        .map((n) => n.id);
      setRemovedNodeIds(c2Nodes);
    } else if (presetType === 'kingpins') {
      const kings = nodes
        .filter((n) => n.role === 'kingpin' || n.role === 'facilitator')
        .map((n) => n.id);
      setRemovedNodeIds(kings);
    } else if (presetType === 'fiat') {
      const fiatNodes = nodes
        .filter((n) => n.type === 'bank_account' || n.type === 'organization' || n.role === 'money_launderer')
        .map((n) => n.id);
      setRemovedNodeIds(fiatNodes);
    }
  };

  const clearAllRemovals = () => {
    setRemovedNodeIds([]);
  };

  if (!simulationResult) return null;

  const { baseline, simulated, componentSplits, disconnectedNodes, optimalCutRankings } = simulationResult;
  const severedFlowUSD = baseline.totalFlowUSD - simulated.totalFlowUSD;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Counterfactual Disruption & What-If Interdiction Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Simulate seizures, server takedowns, and asset freezes to observe cascading network collapse.
          </p>
        </div>

        {/* Action Presets */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => applyPreset('bottlenecks')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/60 text-amber-300 text-xs font-semibold transition-all"
          >
            ⚡ Seize Top Bottlenecks
          </button>
          <button
            onClick={() => applyPreset('c2')}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/90 border border-purple-600/60 text-purple-300 text-xs font-semibold transition-all"
          >
            🛡️ Takedown C2 Grid
          </button>
          <button
            onClick={() => applyPreset('fiat')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-600/60 text-emerald-300 text-xs font-semibold transition-all"
          >
            💰 Freeze Fiat Conduits
          </button>
          {removedNodeIds.length > 0 && (
            <button
              onClick={clearAllRemovals}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Reset Simulation
            </button>
          )}
        </div>
      </div>

      {/* Disruption Scoreboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Disruption Meter Card */}
        <div className="bg-slate-900/95 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Network Disruption Index
              </span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-4xl font-black font-mono mt-3 bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              {simulated.disruptionPercentage}%
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              {removedNodeIds.length} Target(s) Neutralized
            </p>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
              style={{ width: `${simulated.disruptionPercentage}%` }}
            />
          </div>
        </div>

        {/* Severed Capital Card */}
        <div className="bg-slate-900/95 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Severed Capital Flow
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-3">
              -${(severedFlowUSD / 1000000).toFixed(1)}M USD
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Remaining: ${(simulated.totalFlowUSD / 1000000).toFixed(1)}M USD
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {((severedFlowUSD / (baseline.totalFlowUSD || 1)) * 100).toFixed(0)}% Total Liquidity Choked
          </div>
        </div>

        {/* Component Fragmentation Card */}
        <div className="bg-slate-900/95 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Component Split (Islands)
              </span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-purple-400 mt-3">
              {simulated.componentsCount}{' '}
              <span className="text-xs font-normal text-slate-500">
                (from {baseline.componentsCount})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Syndicate fragmented into isolated clusters
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Network Density: {simulated.networkDensity}
          </div>
        </div>

        {/* Disconnected Endpoints Card */}
        <div className="bg-slate-900/95 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Isolated Nodes & Mules
              </span>
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-cyan-400 mt-3">
              {simulated.isolatedNodesCount}
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Completely cut off from command chain
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Zero inbound or outbound flow
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Target Selection Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Interactive Target Interdiction Toggle</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Toggle nodes below to simulate immediate seizure or takedown.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {removedNodeIds.length} Target(s) Seized
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[450px] overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isRemoved = removedNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => toggleNodeRemoval(node.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isRemoved
                        ? 'bg-rose-950/40 border-rose-600/80 shadow-md shadow-rose-950/40'
                        : 'bg-slate-950/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isRemoved ? 'bg-rose-500 line-through' : 'bg-cyan-400'
                          }`}
                        />
                        <div className="truncate">
                          <div
                            className={`font-semibold text-xs truncate ${
                              isRemoved ? 'text-rose-300 line-through' : 'text-slate-200'
                            }`}
                          >
                            {node.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {node.label}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isRemoved
                            ? 'bg-rose-900 text-rose-200'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isRemoved ? 'SEIZED' : 'ACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 text-[10px] font-mono">
                      <span className="text-slate-400 capitalize">{node.role}</span>
                      <span className="text-cyan-400 font-bold">
                        Betweenness: {node.centrality?.betweenness || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subnet Fragmented Islands Breakdown */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-200 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Resulting Subnet Clusters ({componentSplits.length})
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-3">
              Independent isolated network components formed following interdiction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {componentSplits.map((split) => (
                <div
                  key={split.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Cluster #{split.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                      {split.size} Nodes
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Dominant Function: <span className="text-slate-200 capitalize">{split.dominantRole}</span>
                  </div>
                  <div className="text-emerald-400 font-bold text-[11px]">
                    Flow: ${split.flowValueUSD.toLocaleString()} USD
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Algorithmic Interdiction Recommendations */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-200">Optimal Interdiction Sequence</h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-3">
              Single-node cut analysis recommending highest-leverage targets.
            </p>

            <div className="space-y-2.5">
              {optimalCutRankings.map((target, idx) => (
                <div
                  key={target.nodeId}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      Priority #{idx + 1}: {target.nodeName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-bold">
                      {target.disruptionScore}% Score
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {target.reason}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{target.role}</span>
                    <button
                      onClick={() => toggleNodeRemoval(target.nodeId)}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      {removedNodeIds.includes(target.nodeId) ? 'Unseize' : 'Seize Target'} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
