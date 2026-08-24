import React, { useState, useMemo } from 'react';
import { 
  Target, 
  ShieldAlert, 
  ArrowUpDown, 
  Zap, 
  FileText, 
  Search, 
  SlidersHorizontal, 
  CheckSquare, 
  Square, 
  ExternalLink,
  DollarSign,
  Activity,
  Layers,
  Crown
} from 'lucide-react';
import { Entity, EntityRole, ThreatLevel } from '../../types';

interface TargetPrioritizationViewProps {
  nodes: Entity[];
  onSelectNode: (node: Entity) => void;
  onSimulateBatchRemoval: (nodeIds: string[]) => void;
  onGenerateAffidavit: (nodeId: string) => void;
}

export const TargetPrioritizationView: React.FC<TargetPrioritizationViewProps> = ({
  nodes,
  onSelectNode,
  onSimulateBatchRemoval,
  onGenerateAffidavit,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'disruption' | 'betweenness' | 'risk' | 'volume'>('disruption');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // Filter and sort targets
  const filteredTargets = useMemo(() => {
    return nodes
      .filter((n) => {
        if (selectedRole !== 'all' && n.role !== selectedRole) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            n.name.toLowerCase().includes(q) ||
            n.label.toLowerCase().includes(q) ||
            n.role.toLowerCase().includes(q) ||
            (n.metadata?.tags && n.metadata.tags.some((t) => t.toLowerCase().includes(q)))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'disruption') {
          return (b.centrality?.disruptionImpact || 0) - (a.centrality?.disruptionImpact || 0);
        }
        if (sortBy === 'betweenness') {
          return (b.centrality?.betweenness || 0) - (a.centrality?.betweenness || 0);
        }
        if (sortBy === 'risk') {
          return b.riskScore - a.riskScore;
        }
        if (sortBy === 'volume') {
          return (b.metadata?.totalVolumeUSD || 0) - (a.metadata?.totalVolumeUSD || 0);
        }
        return 0;
      });
  }, [nodes, selectedRole, searchQuery, sortBy]);

  // Statistics
  const kingpinsCount = nodes.filter((n) => n.role === 'kingpin').length;
  const facilitatorsCount = nodes.filter((n) => n.role === 'facilitator' || n.role === 'money_launderer').length;
  const c2Count = nodes.filter((n) => n.role === 'c2_controller').length;
  const highImpactCount = nodes.filter((n) => (n.centrality?.disruptionImpact || 0) >= 80).length;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedNodeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedNodeIds(next);
  };

  const selectAll = () => {
    if (selectedNodeIds.size === filteredTargets.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(filteredTargets.map((n) => n.id)));
    }
  };

  const getRoleBadge = (role: EntityRole) => {
    switch (role) {
      case 'kingpin':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
      case 'facilitator':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'money_launderer':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
      case 'c2_controller':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/80';
      case 'infrastructure_provider':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/80';
      case 'mule':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header & Metrics Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Syndicate Target Prioritization & Centrality Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Graph articulation algorithms ranking entities by systemic fragility and interdiction leverage.
          </p>
        </div>

        {/* Batch Action Bar */}
        {selectedNodeIds.size > 0 && (
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-cyan-500/40 animate-fade-in">
            <span className="text-xs font-mono text-cyan-300 font-semibold">
              {selectedNodeIds.size} Targets Selected
            </span>
            <button
              onClick={() => onSimulateBatchRemoval(Array.from(selectedNodeIds))}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Joint Seizure</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Identified Kingpins</span>
            <Crown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">{kingpinsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Malware Authors & Leaders</div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Financial Facilitators</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{facilitatorsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">OTC Desks & Corporate Conduits</div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">C2 Infrastructure</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">{c2Count}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Bulletproof Beacons & Gateways</div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Critical Bridges (≥80%)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">{highImpactCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">High Disruption Bottlenecks</div>
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'kingpin', label: 'Kingpins' },
            { id: 'facilitator', label: 'Facilitators' },
            { id: 'money_launderer', label: 'Launderers' },
            { id: 'c2_controller', label: 'C2 Controllers' },
            { id: 'infrastructure_provider', label: 'Infrastructure' },
            { id: 'mule', label: 'Mules' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRole === tab.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter targets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="disruption" className="bg-slate-900">Disruption Impact</option>
              <option value="betweenness" className="bg-slate-900">Betweenness Centrality</option>
              <option value="risk" className="bg-slate-900">Risk Score</option>
              <option value="volume" className="bg-slate-900">Capital Volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Targets Leaderboard Table */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={selectAll} className="text-slate-400 hover:text-slate-200">
                    {selectedNodeIds.size === filteredTargets.length && filteredTargets.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Subject & Identifier</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Modality</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-3 text-center">Betweenness</th>
                <th className="py-3 px-3 text-center">Disruption Leverage</th>
                <th className="py-3 px-3 text-right">Monitored Volume</th>
                <th className="py-3 px-4 text-center">Interdiction Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTargets.map((target, idx) => {
                const isSelected = selectedNodeIds.has(target.id);
                const disruption = target.centrality?.disruptionImpact || 70;
                return (
                  <tr
                    key={target.id}
                    className={`hover:bg-slate-850/80 transition-colors ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => toggleSelect(target.id)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Rank Badge */}
                    <td className="py-3 px-2 text-center font-bold">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded-full text-xs ${
                          idx === 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : idx === 1
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : idx === 2
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>

                    {/* Subject & Label */}
                    <td className="py-3 px-4 font-sans">
                      <button
                        onClick={() => onSelectNode(target)}
                        className="text-left group"
                      >
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {target.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 group-hover:text-slate-300">
                          {target.label}
                        </div>
                      </button>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRoleBadge(
                          target.role
                        )}`}
                      >
                        {target.role}
                      </span>
                    </td>

                    {/* Modality Type */}
                    <td className="py-3 px-3 text-slate-300 text-[11px] capitalize">
                      {target.type.replace('_', ' ')}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <span
                          className={`font-bold ${
                            target.riskScore >= 90
                              ? 'text-rose-400'
                              : target.riskScore >= 75
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {target.riskScore}
                        </span>
                        <div className="w-12 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${target.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Betweenness */}
                    <td className="py-3 px-3 text-center text-cyan-300 font-bold">
                      {target.centrality?.betweenness || 0}
                    </td>

                    {/* Disruption Impact */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          disruption >= 85
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                            : disruption >= 70
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {disruption}% Impact
                      </span>
                    </td>

                    {/* Monitored Volume */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {target.metadata?.totalVolumeUSD
                        ? `$${(target.metadata.totalVolumeUSD / 1000000).toFixed(1)}M`
                        : target.metadata?.balanceUSD
                        ? `$${(target.metadata.balanceUSD / 1000).toFixed(0)}k`
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5 font-sans">
                        <button
                          onClick={() => onSelectNode(target)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
                          title="View Entity Dossier"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => onGenerateAffidavit(target.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-all"
                          title="Generate Search Warrant / Subpoena"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
