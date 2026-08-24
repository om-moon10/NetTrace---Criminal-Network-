import React, { useState } from 'react';
import { Route, X, ArrowRight, DollarSign, CheckCircle2, Sparkles } from 'lucide-react';
import { Entity, EvidenceEdge } from '../../types';
import { findShortestPath } from '../../utils/graphEngine';

interface PathFinderModalProps {
  nodes: Entity[];
  edges: EvidenceEdge[];
  isOpen: boolean;
  initialSourceId?: string;
  onClose: () => void;
  onHighlightPath: (pathNodeIds: string[], pathEdgeIds: string[]) => void;
}

export const PathFinderModal: React.FC<PathFinderModalProps> = ({
  nodes,
  edges,
  isOpen,
  initialSourceId,
  onClose,
  onHighlightPath,
}) => {
  const [sourceId, setSourceId] = useState<string>(initialSourceId || nodes[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(nodes[nodes.length - 1]?.id || '');
  const [pathResult, setPathResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleFindPath = () => {
    if (!sourceId || !targetId) return;
    const result = findShortestPath(nodes, edges, sourceId, targetId);
    setPathResult(result);
  };

  const handleApplyToGraph = () => {
    if (pathResult) {
      onHighlightPath(pathResult.pathNodeIds, pathResult.pathEdgeIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Route className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Conduit Traceroute & Flow Path Finder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">SOURCE ORIGIN NODE</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">TARGET DESTINATION NODE</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleFindPath}
          className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Trace Shortest Conduit Path</span>
        </button>

        {/* Path Result Box */}
        {pathResult ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-cyan-400 font-bold">
                Conduit Identified: {pathResult.totalDistance} Hop(s)
              </span>
              <span className="text-emerald-400 font-bold">
                Flow: ${pathResult.totalFlowUSD.toLocaleString()} USD
              </span>
            </div>

            {/* Stepper Display */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pathResult.pathNodeIds.map((nodeId: string, idx: number) => {
                const node = nodes.find((n) => n.id === nodeId);
                return (
                  <div key={nodeId} className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="flex-1 bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">{node?.name}</div>
                        <div className="text-[10px] text-slate-500">{node?.label}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-950">
                        {node?.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleApplyToGraph}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Highlight & Isolate in Network Graph
            </button>
          </div>
        ) : pathResult === null ? null : (
          <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs font-mono text-center">
            No direct or indirect communication conduit path found between selected entities.
          </div>
        )}
      </div>
    </div>
  );
};
