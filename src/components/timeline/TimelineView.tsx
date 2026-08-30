import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Radio,
  AlertTriangle,
  Layers,
  Sparkles,
  Globe,
  Server,
  Wallet,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Filter,
  FileText,
  Network,
  Eye,
  Highlighter,
  PlusCircle,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  TimelineEvent,
  Entity,
  TimelineAnalysisResult,
  NormalizedTimelineEvent,
  TemporalCluster,
  InferredSequence
} from '../../types';
import { api } from '../../services/api';

interface TimelineViewProps {
  events?: TimelineEvent[];
  nodes: Entity[];
  onSelectEntity: (nodeId: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToEvidence?: (entityId?: string) => void;
  investigationId?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events: propEvents = [],
  nodes,
  onSelectEntity,
  onNavigateToGraph,
  onNavigateToEvidence,
  investigationId = 'NX-102',
}) => {
  const [selectedWindow, setSelectedWindow] = useState<string>('24h');
  const [analysis, setAnalysis] = useState<TimelineAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected states
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [isHighlightActive, setIsHighlightActive] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal & Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>('');
  const [investigationNotes, setInvestigationNotes] = useState<
    Array<{ id: string; eventId?: string; text: string; timestamp: string }>
  >([]);

  // Fetch timeline analysis from authoritative backend
  const fetchAnalysis = async (windowVal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTimelineAnalysis(investigationId, windowVal);
      setAnalysis(data);

      // Set initial selections
      if (data.events && data.events.length > 0 && !selectedEventId) {
        setSelectedEventId(data.events[0].id);
      }
      if (data.correlations && data.correlations.length > 0 && !selectedCorrelationId) {
        setSelectedCorrelationId(data.correlations[0].id);
      }
      if (data.sequences && data.sequences.length > 0 && !selectedSequenceId) {
        setSelectedSequenceId(data.sequences[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load timeline analysis:', err);
      setError(err.message || 'Failed to perform timeline analysis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedWindow);
  }, [investigationId, selectedWindow]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Active Correlation Cluster
  const activeCorrelation = useMemo(() => {
    if (!analysis || !analysis.correlations) return null;
    return (
      analysis.correlations.find((c) => c.id === selectedCorrelationId) ||
      analysis.correlations[0] ||
      null
    );
  }, [analysis, selectedCorrelationId]);

  // Active Sequence
  const activeSequence = useMemo(() => {
    if (!analysis || !analysis.sequences) return null;
    return (
      analysis.sequences.find((s) => s.id === selectedSequenceId) ||
      analysis.sequences[0] ||
      null
    );
  }, [analysis, selectedSequenceId]);

  // Active Selected Event
  const activeEvent = useMemo(() => {
    if (!analysis || !analysis.events) return null;
    return analysis.events.find((e) => e.id === selectedEventId) || analysis.events[0] || null;
  }, [analysis, selectedEventId]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!analysis || !analysis.events) return [];
    if (categoryFilter === 'ALL') return analysis.events;
    return analysis.events.filter((e) => e.normalizedCategory === categoryFilter);
  }, [analysis, categoryFilter]);

  // Set of event IDs that should be highlighted
  const highlightedEventIds = useMemo(() => {
    if (!isHighlightActive) return new Set<string>();
    const ids = new Set<string>();
    if (activeCorrelation) {
      activeCorrelation.eventIds.forEach((id) => ids.add(id));
    }
    if (activeSequence) {
      activeSequence.eventIds.forEach((id) => ids.add(id));
    }
    return ids;
  }, [isHighlightActive, activeCorrelation, activeSequence]);

  // Helper for category badge styling
  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'THREAT INTELLIGENCE':
        return 'bg-amber-950/70 text-amber-300 border-amber-800';
      case 'INFRASTRUCTURE':
        return 'bg-purple-950/70 text-purple-300 border-purple-800';
      case 'BLOCKCHAIN':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800';
      case 'TRANSACTION':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 'EXCHANGE':
        return 'bg-orange-950/70 text-orange-300 border-orange-800';
      case 'INVESTIGATION':
        return 'bg-blue-950/70 text-blue-300 border-blue-800';
      case 'EVIDENCE':
        return 'bg-rose-950/70 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Helper for entity icon
  const getEntityIcon = (type: string = '') => {
    const t = type.toLowerCase();
    if (t.includes('domain') || t.includes('url')) return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
    if (t.includes('ip') || t.includes('server') || t.includes('device'))
      return <Server className="w-3.5 h-3.5 text-purple-400" />;
    if (t.includes('wallet') || t.includes('blockchain') || t.includes('transaction'))
      return <Wallet className="w-3.5 h-3.5 text-amber-400" />;
    if (t.includes('person') || t.includes('mule') || t.includes('kingpin'))
      return <User className="w-3.5 h-3.5 text-rose-400" />;
    if (t.includes('exchange') || t.includes('organization') || t.includes('bank'))
      return <Building2 className="w-3.5 h-3.5 text-emerald-400" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Action Button Handlers
  const handleViewEntity = () => {
    if (!activeEvent || activeEvent.entityIds.length === 0) {
      showToast('No linked entity available for the selected event.');
      return;
    }
    const targetEntityId = activeEvent.entityIds[0];
    onSelectEntity(targetEntityId);
    if (onNavigateToGraph) {
      onNavigateToGraph(targetEntityId);
    }
  };

  const handleViewEvidence = () => {
    if (!activeEvent || activeEvent.evidenceCount === 0) {
      showToast('No supporting evidence linked to this event.');
      return;
    }
    const targetEntityId = activeEvent.entityIds[0];
    if (onNavigateToEvidence) {
      onNavigateToEvidence(targetEntityId);
    } else {
      showToast(`Viewing ${activeEvent.evidenceCount} verified forensic artifact(s).`);
    }
  };

  const handleViewNetwork = () => {
    if (!activeEvent || activeEvent.entityIds.length === 0) {
      showToast('No linked entity available to display in Network Explorer.');
      return;
    }
    const targetEntityId = activeEvent.entityIds[0];
    if (onNavigateToGraph) {
      onNavigateToGraph(targetEntityId);
    } else {
      onSelectEntity(targetEntityId);
    }
  };

  const handleToggleHighlight = () => {
    setIsHighlightActive((prev) => !prev);
    showToast(!isHighlightActive ? 'Events in active correlation/sequence highlighted.' : 'Highlighting disabled.');
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      eventId: activeEvent?.id,
      text: noteContent.trim(),
      timestamp: new Date().toISOString(),
    };
    setInvestigationNotes((prev) => [newNote, ...prev]);
    setNoteContent('');
    setIsNoteModalOpen(false);
    showToast('Investigation note recorded successfully.');
  };

  // Format timestamp nicely
  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      // e.g. "10:05:00Z" or "2025-09-14 08:30Z"
      const timeStr = d.toISOString().substring(11, 19) + 'Z';
      const dateStr = d.toISOString().substring(0, 10);
      return { dateStr, timeStr };
    } catch {
      return { dateStr: '', timeStr: ts };
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1217] text-slate-100 flex flex-col font-sans pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-cyan-300 border border-cyan-500/50 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-mono animate-fade-in">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 flex flex-col">
        {/* Top Header Section matching Stitch Design */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Timeline Analysis</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Analyze the sequence, timing and potential coordination of investigation events.
              </p>
            </div>

            {/* Reload & Refresh controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAnalysis(selectedWindow)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Refresh Analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Badges Bar matching screenshot */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">TOTAL EVENTS:</span>
              <span className="text-cyan-400 font-bold text-sm">
                {analysis ? analysis.totalEvents : '—'}
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">TIME SPAN:</span>
              <span className="text-white font-bold text-sm">
                {analysis ? analysis.timeSpan.formatted : '—'}
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">CORRELATED EVENTS:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {analysis ? analysis.correlatedEvents : '—'}
              </span>
            </div>

            {/* POTENTIAL SEQUENCES Highlighted in Amber Box matching Stitch UI */}
            <div className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/80 text-xs font-mono text-amber-300 flex items-center gap-2 shadow-lg shadow-amber-950/20">
              <span className="text-amber-200 font-semibold tracking-wide">POTENTIAL SEQUENCES:</span>
              <span className="text-amber-400 font-bold text-sm">
                {analysis ? analysis.potentialSequences : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
          <span className="text-xs font-mono text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            FILTER:
          </span>
          {['ALL', 'THREAT INTELLIGENCE', 'INFRASTRUCTURE', 'BLOCKCHAIN', 'TRANSACTION', 'EXCHANGE', 'INVESTIGATION'].map(
            (cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            }
          )}
        </div>

        {/* Main Content Grid: Left Event Stream & Right Intelligence Panels */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs font-mono text-slate-400">Computing deterministic temporal correlations...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 text-xs font-mono">
            <p className="font-bold text-sm">Error Loading Timeline Analysis</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : analysis?.emptyState ? (
          <div className="py-16 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-xl">
            <Clock className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">{analysis.emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Timeline Event Stream (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-800">
                {filteredEvents.map((ev, index) => {
                  const isSelected = ev.id === activeEvent?.id;
                  const isHighlighted = highlightedEventIds.has(ev.id);
                  const { dateStr, timeStr } = formatTime(ev.timestamp);

                  // Dot color depending on category
                  let dotColor = 'bg-cyan-400 border-cyan-300';
                  if (ev.normalizedCategory === 'THREAT INTELLIGENCE') dotColor = 'bg-amber-400 border-amber-300';
                  else if (ev.normalizedCategory === 'INFRASTRUCTURE') dotColor = 'bg-purple-400 border-purple-300';
                  else if (ev.normalizedCategory === 'TRANSACTION') dotColor = 'bg-emerald-400 border-emerald-300';
                  else if (ev.normalizedCategory === 'EXCHANGE') dotColor = 'bg-orange-400 border-orange-300';

                  return (
                    <div key={ev.id} className="relative group">
                      {/* Timeline Node Dot on the vertical line */}
                      <div
                        className={`absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full border-2 ${dotColor} ${
                          isSelected || isHighlighted
                            ? 'ring-4 ring-cyan-500/30 scale-125'
                            : 'opacity-80 group-hover:opacity-100'
                        } transition-all z-10`}
                      />

                      {/* Event Card */}
                      <div
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900/95 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                            : isHighlighted
                            ? 'bg-slate-900/80 border-amber-500/80 shadow-lg shadow-amber-950/20'
                            : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {/* Header: Timestamp, Category Badge, Verification Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-slate-300 font-bold">{timeStr}</span>
                            <span className="text-[10px] text-slate-500">({dateStr})</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCategoryBadgeStyle(
                                ev.normalizedCategory
                              )}`}
                            >
                              {ev.normalizedCategory}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ev.amountUSD !== undefined && ev.amountUSD > 0 && (
                              <span className="text-emerald-400 text-xs font-mono font-bold mr-1">
                                +${ev.amountUSD >= 1000000
                                  ? `${(ev.amountUSD / 1000000).toFixed(1)}M`
                                  : `${Math.round(ev.amountUSD / 1000)}k`}{' '}
                                USD
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                ev.verificationStatus === 'VERIFIED'
                                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                  : ev.verificationStatus === 'PENDING'
                                  ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                                  : 'text-rose-400 bg-rose-950/60 border-rose-800'
                              }`}
                            >
                              {ev.verificationStatus}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-sm font-semibold text-slate-100 mb-1">{ev.title}</h2>

                        {/* Linked Entities with type icons */}
                        {ev.entities.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 my-2">
                            {ev.entities.map((ent) => (
                              <span
                                key={ent.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 text-[11px] font-mono"
                              >
                                {getEntityIcon(ent.type)}
                                <span>{ent.label}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                          {ev.description}
                        </p>

                        {/* Event Footer Details */}
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <div className="flex items-center gap-3">
                            {ev.isCorrelated && (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Radio className="w-3 h-3" />
                                <span>Correlated</span>
                              </span>
                            )}
                            {ev.evidenceCount > 0 && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                                <span>{ev.evidenceCount} Evidence Item(s)</span>
                              </span>
                            )}
                          </div>

                          <span className="text-slate-500 text-[10px]">ID: {ev.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Potentially Coordinated Activity, Sequence Flow, Timeline Insight (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: Potentially Coordinated Activity matching screenshot */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        Potentially Coordinated Activity
                      </h2>
                      <span className="text-[10px] font-mono text-slate-400">
                        {analysis?.correlations.length || 0} Cluster(s) Identified
                      </span>
                    </div>
                  </div>

                  {/* Window Duration Controls */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Window Duration</span>
                    <span className="text-amber-400 font-bold font-mono text-xs">
                      {activeCorrelation?.durationFormatted || analysis?.windowDurationFormatted || '24 Hours'}
                    </span>
                  </div>
                </div>

                {/* Window Selector Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['15m', '30m', '1h', '6h', '24h', '7d', '30d'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWindow(w)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                        selectedWindow === w
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* Metrics Box (EVENTS & ENTITIES) matching screenshot */}
                {activeCorrelation ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] font-mono text-slate-400 block">EVENTS</span>
                        <span className="text-xl font-bold font-mono text-cyan-400">
                          {activeCorrelation.eventCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] font-mono text-slate-400 block">ENTITIES</span>
                        <span className="text-xl font-bold font-mono text-amber-400">
                          {activeCorrelation.entitiesInvolved.length}
                        </span>
                      </div>
                    </div>

                    {/* Warning Callout Box matching screenshot */}
                    <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-sans">{activeCorrelation.alertMessage}</p>
                    </div>

                    {/* Correlation Strength & Independent Confidence */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs font-mono">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Correlation Strength</span>
                        <span className="text-amber-400 font-bold">
                          {activeCorrelation.correlationStrength}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${activeCorrelation.correlationStrength}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span className="text-slate-400">Confidence Score</span>
                        <span className="text-cyan-400 font-bold">{activeCorrelation.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${activeCorrelation.confidence}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-950 text-center text-xs text-slate-500">
                    No active correlation for the selected window.
                  </div>
                )}
              </div>

              {/* Card 2: Inferred Sequence Flow matching Stitch UI */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white">Inferred Sequence Flow</h2>
                  </div>
                  {analysis && analysis.sequences.length > 1 && (
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {analysis.sequences.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSequenceId(s.id)}
                          className={`px-2 py-0.5 rounded ${
                            selectedSequenceId === s.id
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Seq {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activeSequence && activeSequence.steps.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {activeSequence.description}
                    </p>

                    {/* Step Flow List */}
                    <div className="space-y-2 pt-2">
                      {activeSequence.steps.map((step, idx) => {
                        const isLast = idx === activeSequence.steps.length - 1;
                        return (
                          <div key={step.eventId} className="relative flex items-start gap-3 group">
                            {/* Step Badge */}
                            <div className="w-6 h-6 rounded-full bg-slate-950 border border-cyan-500/50 text-cyan-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 z-10">
                              {step.stepNumber}
                            </div>

                            {/* Connecting vertical line */}
                            {!isLast && (
                              <div className="absolute left-3 top-6 bottom-0 w-[1px] bg-slate-800" />
                            )}

                            {/* Step Content Box */}
                            <div
                              onClick={() => setSelectedEventId(step.eventId)}
                              className={`flex-1 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border transition-all cursor-pointer ${
                                selectedEventId === step.eventId
                                  ? 'border-cyan-500 shadow'
                                  : 'border-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200 text-xs">
                                  {step.title}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getCategoryBadgeStyle(
                                    step.normalizedCategory
                                  )}`}
                                >
                                  {step.normalizedCategory}
                                </span>
                              </div>

                              {step.entityLabel && (
                                <div className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                                  <span>{step.entityLabel}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-950 text-center text-xs text-slate-500 font-mono">
                    No significant sequence detected from available events.
                  </div>
                )}
              </div>

              {/* Card 3: Timeline Insight */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Timeline Insight</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {analysis?.insights}
                </p>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] font-mono text-slate-500 leading-relaxed italic">
                    {analysis?.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar matching screenshot */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e13]/95 backdrop-blur border-t border-slate-800 py-3 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Active selection summary on left */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500">SELECTED:</span>
            <span className="text-slate-200 font-bold max-w-[200px] sm:max-w-xs truncate">
              {activeEvent ? activeEvent.title : 'None'}
            </span>
          </div>

          {/* Action Buttons matching screenshot */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleViewEntity}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>View Entity</span>
            </button>

            <button
              onClick={handleViewEvidence}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Evidence</span>
            </button>

            <button
              onClick={handleViewNetwork}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>View Network</span>
            </button>

            <button
              onClick={handleToggleHighlight}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
                isHighlightActive
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
              <span>Highlight Events</span>
            </button>

            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Investigation Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Investigation Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add Investigation Note</h3>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeEvent && (
              <div className="p-2.5 rounded-lg bg-slate-950 text-xs font-mono border border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[10px]">ATTACHED EVENT:</span>
                <span className="font-semibold text-cyan-300">{activeEvent.title}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Forensic Note & Observations</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter investigator observations, correlation hypothesis, or subpoena follow-up task..."
                rows={4}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-bold shadow-md"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
