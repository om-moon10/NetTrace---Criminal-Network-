import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Activity,
  Network,
  FileText,
  Search,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Flag,
  Share2,
  RefreshCw,
  Eye,
  ChevronRight,
  BarChart3,
  Server,
  Wallet,
  Globe,
  Radio,
  Clock,
  Filter,
  Plus
} from 'lucide-react';
import { KingpinCandidate, KingpinAnalysisResult, Entity } from '../../types';
import { api } from '../../services/api';

interface PotentialKingpinViewProps {
  investigationId?: string;
  onNavigateToGraph: (entityId?: string) => void;
  onNavigateToEvidence: (entityId?: string) => void;
  onNavigateToSimulation: (entityId: string) => void;
  onSelectEntity?: (entityId: string) => void;
}

type KingpinSubView = 'overview' | 'evidence_simulation' | 'why_this_entity';

export const PotentialKingpinView: React.FC<PotentialKingpinViewProps> = ({
  investigationId = 'NX-102',
  onNavigateToGraph,
  onNavigateToEvidence,
  onNavigateToSimulation,
  onSelectEntity,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KingpinAnalysisResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [subView, setSubView] = useState<KingpinSubView>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedEntities, setFlaggedEntities] = useState<Set<string>>(new Set());
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  // Fetch Kingpin data from the real backend API
  const fetchKingpinData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getKingpinCandidates(investigationId);
      setData(res);
      if (res.candidates && res.candidates.length > 0) {
        if (!selectedCandidateId || !res.candidates.some((c) => c.entityId === selectedCandidateId)) {
          setSelectedCandidateId(res.topCandidate?.entityId || res.candidates[0].entityId);
        }
      }
    } catch (err: any) {
      console.error('Failed to load kingpin candidates:', err);
      setError(err.message || 'Failed to calculate potential kingpin candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKingpinData();
  }, [investigationId]);

  // Selected candidate object
  const activeCandidate = useMemo<KingpinCandidate | null>(() => {
    if (!data || !data.candidates || data.candidates.length === 0) return null;
    return data.candidates.find((c) => c.entityId === selectedCandidateId) || data.topCandidate || data.candidates[0];
  }, [data, selectedCandidateId]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    if (!data || !data.candidates) return [];
    if (!searchQuery.trim()) return data.candidates;
    const q = searchQuery.toLowerCase();
    return data.candidates.filter(
      (c) =>
        c.entityName.toLowerCase().includes(q) ||
        c.entityLabel.toLowerCase().includes(q) ||
        c.entityType.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const toggleFlagEntity = (entityId: string) => {
    setFlaggedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    setNoteModalOpen(false);
    setNoteText('');
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 3000);
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <Crown className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-mono text-slate-300">Calculating Strategic Network Influence & Centrality...</p>
        <p className="text-xs text-slate-500">Processing Brandes betweenness, cross-cluster articulation, and transaction flows</p>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-slate-100">
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
          <h2 className="text-lg font-bold text-rose-200">Kingpin Detection Calculation Error</h2>
          <p className="text-sm text-slate-300 max-w-lg">{error}</p>
          <button
            onClick={fetchKingpinData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Calculation</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Empty State
  if (!data || data.emptyState || !data.candidates || data.candidates.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-slate-100">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <Crown className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-200">Insufficient Network Evidence</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {data?.emptyMessage ||
              'Insufficient network evidence to calculate a reliable Potential Kingpin candidate. Ingest additional transaction telemetry or cyber infrastructure indicators to begin analysis.'}
          </p>
          <button
            onClick={() => onNavigateToEvidence()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Telemetry Logs</span>
          </button>
        </div>
      </div>
    );
  }

  const candidate = activeCandidate || data.candidates[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100 animate-fade-in">
      {/* Toast Notification */}
      {noteSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Investigation note recorded in cryptographic case log</span>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Add Note: {candidate.entityName}</span>
              </h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record forensic observation, warrant hypothesis, or interdiction rationale..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTIVE CONTEXT                                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Potential Kingpin Detection
            </h1>
            <span className="text-[10px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full font-semibold">
              Strategic Influence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Identify entities with the highest strategic influence across the investigation network.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Context Card */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg">
            <Layers className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">ACTIVE CONTEXT</div>
              <div className="text-xs font-bold text-slate-200">
                {investigationId} — Phantom Ledger
              </div>
            </div>
          </div>

          {/* SubView Selector Switch */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSubView('overview')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                subView === 'overview'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSubView('evidence_simulation')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                subView === 'evidence_simulation'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evidence & Sim
            </button>
            <button
              onClick={() => setSubView('why_this_entity')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                subView === 'why_this_entity'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Why This Entity?
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Quick Selector Pills (Top 5 Candidates) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-mono text-slate-400 uppercase whitespace-nowrap">Candidates:</span>
        {data.candidates.slice(0, 5).map((c) => {
          const isSelected = c.entityId === candidate.entityId;
          return (
            <button
              key={c.entityId}
              onClick={() => setSelectedCandidateId(c.entityId)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/50 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="font-mono text-[10px] text-slate-500 font-normal">#{c.rank}</span>
              <span>{c.entityName}</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-800 text-slate-300 font-mono">
                {c.kingpinScore}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. SUBVIEW 1: OVERVIEW MODE (Matching Image 1)                            */}
      {/* ========================================================================= */}
      {subView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Potential Kingpin Card (2 Cols on Large Screen) */}
          <div className="lg:col-span-2 bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Accent Gradient Border Glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-cyan-500 to-indigo-500" />

            {/* Badges and Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 bg-rose-950/90 text-rose-300 border border-rose-700/80 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>POTENTIAL KINGPIN</span>
                </span>
                <span className="bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase">
                  {candidate.entityType.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">STATUS</span>
                <span className="border border-rose-600/70 bg-rose-950/40 text-rose-300 text-[11px] px-2.5 py-0.5 rounded font-mono font-semibold">
                  {candidate.statusTag}
                </span>
              </div>
            </div>

            {/* Entity Title & Identifiers */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-cyan-300">
                  {candidate.entityName}
                </h2>
                <button
                  onClick={() => copyToClipboard(candidate.entityLabel || candidate.entityId)}
                  title="Copy Identifier"
                  className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span>ID: {candidate.entityLabel || candidate.entityId}</span>
                <span>•</span>
                <span>
                  First Seen: {candidate.metadata?.firstSeen || '2023-10-14 08:22:19Z'}
                </span>
              </div>
            </div>

            {/* 3 Metric Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Metric 1: Kingpin Influence Score */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Crown className="w-3.5 h-3.5 text-rose-400" />
                  <span>KINGPIN INFLUENCE SCORE</span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-slate-100 tracking-tight">
                    {candidate.kingpinScore}
                  </span>
                  <span className="text-base text-slate-400 font-mono font-normal">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                    style={{ width: `${candidate.kingpinScore}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Confidence */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CONFIDENCE</span>
                </div>
                <div className="text-3xl font-extrabold text-amber-300 tracking-tight font-mono">
                  {candidate.confidence}%
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Strong correlation with multiple known illicit nodes in phantom subnet.
                </p>
              </div>

              {/* Metric 3: Risk */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>RISK</span>
                </div>
                <div className="text-2xl font-extrabold text-rose-400 tracking-tight uppercase font-mono">
                  {candidate.threatLevel === 'critical' || candidate.riskScore >= 85 ? 'CRITICAL' : 'HIGH'}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Immediate isolation recommended to prevent lateral asset movement.
                </p>
              </div>
            </div>

            {/* Supporting Factors List */}
            <div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Key Strategic Indicators:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {candidate.supportingIndicators.map((ind, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Card Footer: Disclaimer & Deep Dive Action */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-2 text-[11px] text-slate-400 max-w-md">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Analytical hypothesis based on observable network characteristics. Human verification required.
                </span>
              </div>

              <button
                onClick={() => setSubView('why_this_entity')}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500 rounded-xl text-xs font-bold transition-all group shrink-0"
              >
                <span>Deep Dive Analysis</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Column: Topological Factors & Volume Trajectory */}
          <div className="space-y-6">
            {/* Card 1: Topological Factors */}
            <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Topological Factors</span>
              </div>

              <div className="space-y-4">
                {/* Degree Centrality */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Degree Centrality</span>
                    <span className="text-cyan-300 font-bold">{candidate.factors.degreeCentrality}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${candidate.factors.degreeCentrality}%` }}
                    />
                  </div>
                </div>

                {/* Betweenness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Betweenness</span>
                    <span className="text-amber-300 font-bold">{candidate.factors.betweennessCentrality}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${candidate.factors.betweennessCentrality}%` }}
                    />
                  </div>
                </div>

                {/* Closeness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Closeness</span>
                    <span className="text-emerald-300 font-bold">
                      {candidate.factors.closenessCentrality || 78}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${candidate.factors.closenessCentrality || 78}%` }}
                    />
                  </div>
                </div>

                {/* Cross-Cluster */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Cross-Cluster Articulation</span>
                    <span className="text-purple-300 font-bold">{candidate.factors.crossClusterInfluence}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${candidate.factors.crossClusterInfluence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Volume Trajectory */}
            <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Volume Trajectory</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 text-center space-y-2">
                <Activity className="w-6 h-6 text-cyan-400 mx-auto animate-pulse" />
                <div className="text-xs font-semibold text-slate-300">
                  ${((candidate.metadata?.totalVolumeUSD || 14200000) / 1000000).toFixed(1)}M Monitored Volume
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Live flow rendering available in Deep Dive mode.
                </p>
              </div>

              <button
                onClick={() => onNavigateToSimulation(candidate.entityId)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/80 text-amber-300 rounded-xl text-xs font-bold transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Node Disruption</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBVIEW 2: EVIDENCE & SIMULATION (Matching Image 2)                    */}
      {/* ========================================================================= */}
      {subView === 'evidence_simulation' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <span>INV-9942</span>
                <span>/</span>
                <span>{candidate.entityName} Analysis</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-rose-950/90 text-rose-300 border border-rose-700/80 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase">
                  KINGPIN NODE DETECTED
                </span>
                <span className="bg-amber-950/90 text-amber-300 border border-amber-700/80 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase">
                  HIGH PRIORITY
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                  {candidate.entityName} {candidate.entityLabel ? `(${candidate.entityLabel.slice(0, 10)}...)` : ''}
                </h2>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Active Monitoring</span>
                </span>
                <span>|</span>
                <span>Last Activity: 14 mins ago</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFlagEntity(candidate.entityId)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  flaggedEntities.has(candidate.entityId)
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedEntities.has(candidate.entityId) ? 'Flagged Target' : 'Flag Entity'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supporting Evidence Table (2 Cols) */}
            <div className="lg:col-span-2 bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Supporting Evidence</span>
                </div>
                <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-200" />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3 font-semibold">EVIDENCE VECTOR</th>
                      <th className="pb-3 font-semibold">STRENGTH</th>
                      <th className="pb-3 font-semibold">CONFIDENCE METRIC</th>
                      <th className="pb-3 font-semibold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {candidate.supportingEvidence.map((ev, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 text-slate-200 font-medium">
                          {ev.vector}
                          <div className="text-[10px] text-slate-400 font-normal">{ev.details}</div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.strength === 'VERY HIGH'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : ev.strength === 'HIGH'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {ev.strength}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-8 text-slate-300 font-bold">{ev.confidenceMetric}%</span>
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  ev.strength === 'VERY HIGH'
                                    ? 'bg-rose-400'
                                    : ev.strength === 'HIGH'
                                    ? 'bg-cyan-400'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${ev.confidenceMetric}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onNavigateToEvidence(candidate.entityId)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs hover:underline"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Decision Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="border-2 border-rose-500/80 bg-rose-950/30 rounded-xl px-4 py-2 text-center">
                    <div className="text-3xl font-extrabold text-slate-100 font-mono">{candidate.kingpinScore}</div>
                    <div className="text-[9px] font-mono uppercase text-slate-400">SCORE / 100</div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Decision: High Confidence Flag</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Confidence: {candidate.confidence}%</span>
                      </span>
                      <span>|</span>
                      <span>Primary Reason: Network Centrality ({candidate.factors.betweennessCentrality}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onNavigateToGraph(candidate.entityId)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View Network</span>
                  </button>
                  <button
                    onClick={() => onNavigateToEvidence(candidate.entityId)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Evidence</span>
                  </button>
                  <button
                    onClick={() => setNoteModalOpen(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Investigation Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: SIMULATE NETWORK IMPACT Card */}
            <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>SIMULATE NETWORK IMPACT</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Execute a theoretical takedown or isolation of this node to visualize cascading effects across connected threat clusters.
                </p>

                {/* Preview Metrics */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-800/60 pb-2">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Preview Metrics</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Connections</span>
                      <span className="text-slate-200 font-bold">{candidate.impactPreview.currentConnections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Affected Clusters</span>
                      <span className="text-slate-200 font-bold">{candidate.impactPreview.affectedClusters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potentially Isolated Nodes</span>
                      <span className="text-emerald-400 font-bold">{candidate.impactPreview.potentiallyIsolatedNodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Network Impact</span>
                      <span className="text-rose-400 font-bold">{candidate.impactPreview.estimatedNetworkImpact}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToSimulation(candidate.entityId)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate Network Impact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUBVIEW 3: WHY THIS ENTITY? (Matching Image 3)                         */}
      {/* ========================================================================= */}
      {subView === 'why_this_entity' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-3 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="bg-rose-950/90 text-rose-300 border border-rose-700/80 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase">
                  PRIORITY TARGET
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-cyan-300">
                  {candidate.entityName}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-xs font-mono text-slate-300">
                  <span className="text-slate-400">CONFIDENCE SCORE: </span>
                  <span className="text-cyan-400 font-bold">{candidate.confidence}%</span>
                </div>
                <button
                  onClick={() => toggleFlagEntity(candidate.entityId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedEntities.has(candidate.entityId) ? 'Flagged Target' : 'Flag Entity'}</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100">Why This Entity?</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                Algorithmic determination of the Potential Kingpin. This view explains the prioritization of the target entity based on structural network analysis, transactional volume, and associated evidentiary risk scores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Weighted Analytical Factors */}
            <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Weighted Analytical Factors</span>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4">
                {candidate.factorBreakdown.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <span className="text-slate-300 font-medium">{f.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 font-normal">{(f.weight * 100).toFixed(0)}% weight</span>
                        <span className="text-cyan-300 font-bold">{f.score}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          f.name.includes('Risk')
                            ? 'bg-rose-400'
                            : f.name.includes('Betweenness')
                            ? 'bg-cyan-400'
                            : f.name.includes('Cross')
                            ? 'bg-purple-400'
                            : f.name.includes('Transaction')
                            ? 'bg-amber-400'
                            : f.name.includes('Evidence')
                            ? 'bg-emerald-400'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${f.score}%` }}
                      />
                    </div>

                    {f.description && (
                      <p className="text-[10px] text-slate-400 italic">"{f.description}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Network Influence Map */}
            <div className="bg-[#0d1520] border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span>Network Influence Map</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Search className="w-4 h-4 cursor-pointer hover:text-slate-200" />
                    <Filter className="w-4 h-4 cursor-pointer hover:text-slate-200" />
                  </div>
                </div>

                {/* Mini SVG Graph Canvas */}
                <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 h-64 relative flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full">
                    {/* Background grid dots */}
                    <pattern id="dot-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="0.8" fill="#1e293b" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#dot-pattern)" />

                    {/* Connecting Edges */}
                    <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />

                    {/* Surrounding Connected Neighbor Nodes */}
                    {/* Neighbor 1 */}
                    <g transform="translate(60, 50)">
                      <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="4" fill="#93c5fd" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Batch Tx
                      </text>
                    </g>

                    {/* Neighbor 2 */}
                    <g transform="translate(230, 50)">
                      <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
                      <text x="0" y="4" fill="#fde68a" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        Exchange C
                      </text>
                    </g>

                    {/* Neighbor 3 */}
                    <g transform="translate(60, 180)">
                      <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                      <text x="0" y="4" fill="#fca5a5" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        darkweb-op.io
                      </text>
                    </g>

                    {/* Neighbor 4 */}
                    <g transform="translate(230, 180)">
                      <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                      <text x="0" y="4" fill="#cbd5e1" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        192.168.x.x
                      </text>
                    </g>

                    {/* Central Kingpin Node */}
                    <g transform="translate(150, 115)">
                      <rect x="-55" y="-18" width="110" height="36" rx="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                      <text x="0" y="-1" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        TREASURY WALLET
                      </text>
                      <text x="0" y="11" fill="#bae6fd" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {candidate.entityLabel ? candidate.entityLabel.slice(0, 10) : '0x7a...9f3'}
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Floating Impact Metrics Card */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2 mt-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="font-semibold uppercase text-[10px] text-slate-300">Impact Metrics</span>
                    <Info className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Connected Entities:</span>
                      <span className="text-slate-200 font-bold">{candidate.impactPreview.currentConnections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clusters Connected:</span>
                      <span className="text-slate-200 font-bold">{candidate.impactPreview.affectedClusters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Critical Paths:</span>
                      <span className="text-rose-400 font-bold">{candidate.impactPreview.criticalPaths}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disrupted Rels:</span>
                      <span className="text-cyan-400 font-bold">{candidate.impactPreview.potentiallyDisruptedRelationships}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => onNavigateToGraph(candidate.entityId)}
                  className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Open Full Network Graph</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer Footer across all views */}
      <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 text-[11px] gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{data.disclaimer}</span>
        </div>
        <span className="font-mono text-slate-600">Deterministic Topological Engine • NetTrace v3.8</span>
      </div>
    </div>
  );
};
