import React, { useState, useEffect } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Filter, 
  DollarSign, 
  Phone, 
  Server, 
  Eye, 
  ShieldAlert, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { TimelineEvent, Entity } from '../../types';

interface TimelineViewProps {
  events: TimelineEvent[];
  nodes: Entity[];
  onSelectEntity: (nodeId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  nodes,
  onSelectEntity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(events.length - 1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Sorted events ascending by timestamp for chronological replay
  const sortedEvents = React.useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (selectedCategory === 'all') return sortedEvents;
    return sortedEvents.filter((e) => e.category === selectedCategory);
  }, [sortedEvents, selectedCategory]);

  // Autoplay scrubber
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentEventIndex((prev) => {
          if (prev >= sortedEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sortedEvents.length, playbackSpeed]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'transaction':
        return { label: 'FINANCIAL FLOW', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700', icon: DollarSign };
      case 'communication':
        return { label: 'ENCRYPTED COMMS', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700', icon: Phone };
      case 'infrastructure_spawn':
        return { label: 'INFRASTRUCTURE', color: 'text-purple-400 bg-purple-950/80 border-purple-700', icon: Server };
      case 'surveillance_hit':
        return { label: 'SIGINT INTERCEPT', color: 'text-rose-400 bg-rose-950/80 border-rose-700', icon: Eye };
      default:
        return { label: 'THREAT ALERT', color: 'text-amber-400 bg-amber-950/80 border-amber-700', icon: ShieldAlert };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Chronological Syndicate Timeline & Flow Scrubber
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Forensic event stream reconstructing syndicate inception, extortion disbursements, and communications over time.
          </p>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setCurrentEventIndex(0)}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Jump to Inception"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
          </button>

          <button
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 5 : 1))}
            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono font-bold"
          >
            {playbackSpeed}x Speed
          </button>
        </div>
      </div>

      {/* Scrubber Progress Slider */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">
            Current Incident {currentEventIndex + 1} of {sortedEvents.length}
          </span>
          <span className="text-cyan-400 font-bold">
            {sortedEvents[currentEventIndex]
              ? new Date(sortedEvents[currentEventIndex].timestamp).toUTCString()
              : ''}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={sortedEvents.length - 1}
          value={currentEventIndex}
          onChange={(e) => setCurrentEventIndex(Number(e.target.value))}
          className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
        />
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 py-0.5">
        {[
          { id: 'all', label: 'All Incidents' },
          { id: 'transaction', label: 'Financial Flows' },
          { id: 'communication', label: 'Encrypted Comms' },
          { id: 'surveillance_hit', label: 'Surveillance Hits' },
          { id: 'threat_alert', label: 'Threat Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chronological Event Cards List */}
      <div className="space-y-3">
        {filteredEvents.map((ev, index) => {
          const badge = getCategoryBadge(ev.category);
          const Icon = badge.icon;
          const isCurrentInScrubber = sortedEvents.indexOf(ev) === currentEventIndex;

          return (
            <div
              key={ev.id}
              className={`p-4 rounded-xl border transition-all ${
                isCurrentInScrubber
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-950/50 scale-[1.01]'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-2.5">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-200">{ev.title}</span>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  {ev.amountUSD && (
                    <span className="text-emerald-400 font-bold">
                      +${(ev.amountUSD / 1000000 >= 1
                        ? `${(ev.amountUSD / 1000000).toFixed(1)}M`
                        : `${(ev.amountUSD / 1000).toFixed(0)}k`)}{' '}
                      USD
                    </span>
                  )}
                  <span className="text-slate-400">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{ev.description}</p>

              {/* Linked Entities Chips */}
              {ev.entityIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-850">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Correlated Nodes:</span>
                  {ev.entityIds.map((entId) => {
                    const node = nodes.find((n) => n.id === entId);
                    return (
                      <button
                        key={entId}
                        onClick={() => onSelectEntity(entId)}
                        className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-800 hover:border-cyan-500 transition-colors flex items-center gap-1"
                      >
                        <span>{node ? node.name : entId}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
