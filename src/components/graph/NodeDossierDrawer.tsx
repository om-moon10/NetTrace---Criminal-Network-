import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Zap, 
  Route, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  ShieldAlert, 
  Activity, 
  Globe, 
  Cpu, 
  Lock, 
  DollarSign, 
  Phone, 
  Server, 
  AlertCircle 
} from 'lucide-react';
import { Entity, EvidenceEdge, EntityStatus } from '../../types';

interface NodeDossierDrawerProps {
  entity: Entity | null;
  edges: EvidenceEdge[];
  onClose: () => void;
  onSimulateRemoval: (entityId: string) => void;
  onFindPathFromNode: (entityId: string) => void;
  onDetectHiddenRelationships?: (entityId: string) => void;
  onGenerateAffidavit: (entityId: string) => void;
  onAskCopilot: (entity: Entity) => void;
  onUpdateStatus: (entityId: string, status: EntityStatus) => void;
  onSelectConnectedNode: (connectedId: string) => void;
}

export const NodeDossierDrawer: React.FC<NodeDossierDrawerProps> = ({
  entity,
  edges,
  onClose,
  onSimulateRemoval,
  onFindPathFromNode,
  onDetectHiddenRelationships,
  onGenerateAffidavit,
  onAskCopilot,
  onUpdateStatus,
  onSelectConnectedNode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!entity) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(entity.label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Connected edges for this node
  const connectedEdges = edges.filter(
    (e) => e.source === entity.id || e.target === entity.id
  );

  const getThreatBadgeClass = (threat: string) => {
    switch (threat) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'high':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'medium':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60';
      case 'low':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 max-w-[90vw] bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl shadow-2xl z-30 flex flex-col overflow-hidden text-slate-100 animate-slide-left">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between">
        <div className="flex-1 pr-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getThreatBadgeClass(
                entity.threatLevel
              )}`}
            >
              {entity.threatLevel} THREAT
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {entity.role}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 mt-1.5 leading-tight">{entity.name}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[200px]">
              {entity.label}
            </span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
              title="Copy Identifier"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body: Scrollable Dossier Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs divide-y divide-slate-800/60">
        {/* Risk & Centrality Summary Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Risk Rating</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {entity.riskScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full"
                style={{ width: `${entity.riskScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Disruption Impact</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {entity.centrality?.disruptionImpact || 75}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Network Articulation</div>
          </div>
        </div>

        {/* Transaction Forensics Card */}
        {entity.metadata?.txId && (
          <div className="pt-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> On-Chain Transaction Forensics
            </div>
            <div className="space-y-1.5 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">TX Hash / ID:</span>
                <span className="text-emerald-400 font-bold">{entity.metadata.txId}</span>
              </div>
              {entity.metadata.amount && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Transfer Value:</span>
                  <span className="text-amber-300 font-bold">${entity.metadata.amount.toLocaleString()} USD</span>
                </div>
              )}
              {entity.metadata.protocol && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol / Mechanism:</span>
                  <span className="text-slate-200">{entity.metadata.protocol}</span>
                </div>
              )}
              {entity.metadata.sender && (
                <div className="flex justify-between truncate">
                  <span className="text-slate-400 mr-2">Sender:</span>
                  <span className="text-slate-300 truncate">{entity.metadata.sender}</span>
                </div>
              )}
              {entity.metadata.receiver && (
                <div className="flex justify-between truncate">
                  <span className="text-slate-400 mr-2">Receiver:</span>
                  <span className="text-slate-300 truncate">{entity.metadata.receiver}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Potential Role Inference (Phase 4 Intelligence Engine) */}
        {(entity.potentialRole || (entity.potentialRoles && entity.potentialRoles.length > 0)) && (
          <div className="pt-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Inferred Syndicate Role
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Primary Inferred Role:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold uppercase">
                  {entity.potentialRole || entity.role}
                </span>
              </div>
              {entity.potentialRoles && entity.potentialRoles.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {entity.potentialRoles.map((r, i) => (
                    <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {r.role} ({Math.round(r.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Centrality Metrics Details */}
        <div className="pt-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Graph Centrality Forensics
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="bg-slate-900/50 p-2 rounded border border-slate-850 flex justify-between">
              <span className="text-slate-400">Betweenness:</span>
              <span className="text-cyan-300 font-bold">{entity.centrality?.betweenness || 0}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-850 flex justify-between">
              <span className="text-slate-400">Degree:</span>
              <span className="text-cyan-300 font-bold">{entity.centrality?.degree || connectedEdges.length}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-850 flex justify-between">
              <span className="text-slate-400">Closeness:</span>
              <span className="text-cyan-300 font-bold">{entity.centrality?.closeness || 0.5}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-850 flex justify-between">
              <span className="text-slate-400">PageRank:</span>
              <span className="text-cyan-300 font-bold">{entity.centrality?.pageRank || 1.0}</span>
            </div>
          </div>
        </div>

        {/* Financial & Asset Metadata */}
        {(entity.metadata?.totalVolumeUSD || entity.metadata?.balanceUSD) && (
          <div className="pt-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Financial Telemetry
            </div>
            <div className="space-y-1.5 font-mono bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              {entity.metadata.blockchain && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Blockchain Network:</span>
                  <span className="text-slate-200 font-semibold">{entity.metadata.blockchain}</span>
                </div>
              )}
              {entity.metadata.totalVolumeUSD && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Monitored Volume:</span>
                  <span className="text-emerald-400 font-bold">
                    ${entity.metadata.totalVolumeUSD.toLocaleString()} USD
                  </span>
                </div>
              )}
              {entity.metadata.balanceUSD && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="text-cyan-400 font-bold">
                    ${entity.metadata.balanceUSD.toLocaleString()} USD
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical / Infrastructure Profile */}
        {(entity.metadata?.country || entity.metadata?.asn || entity.metadata?.isp || entity.metadata?.jurisdiction) && (
          <div className="pt-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Infrastructure & Attribution
            </div>
            <div className="space-y-1.5 font-mono bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              {entity.metadata.country && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Jurisdiction / Location:</span>
                  <span className="text-slate-200">{entity.metadata.country} {entity.metadata.city ? `(${entity.metadata.city})` : ''}</span>
                </div>
              )}
              {entity.metadata.asn && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Autonomous System:</span>
                  <span className="text-slate-200">{entity.metadata.asn}</span>
                </div>
              )}
              {entity.metadata.isp && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ISP / Bulletproof Host:</span>
                  <span className="text-slate-200">{entity.metadata.isp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Investigator Notes & Aliases */}
        {entity.metadata?.notes && (
          <div className="pt-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Investigator Intelligence Notes
            </div>
            <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
              {entity.metadata.notes}
            </p>
          </div>
        )}

        {/* Connected Evidence Links */}
        <div className="pt-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
            <span>Correlated Edges ({connectedEdges.length})</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {connectedEdges.map((e) => {
              const otherId = e.source === entity.id ? e.target : e.source;
              const isSource = e.source === entity.id;
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectConnectedNode(otherId)}
                  className="w-full p-2 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 hover:border-cyan-600 text-left transition-colors flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-slate-200 text-[11px] truncate">{e.label}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {isSource ? '→ Inflow to ' : '← Outflow from '} {otherId}
                    </div>
                  </div>
                  {e.value > 0 && (
                    <div className="text-right font-mono text-[10px] text-cyan-400 font-bold flex-shrink-0">
                      ${(e.value / 1000000 >= 1 ? `${(e.value / 1000000).toFixed(1)}M` : `${(e.value / 1000).toFixed(0)}k`)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Simulate Removal */}
          <button
            onClick={() => onSimulateRemoval(entity.id)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/60 text-amber-300 text-xs font-semibold transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Seizure</span>
          </button>

          {/* Trace Conduit / Hidden Relationships */}
          <button
            onClick={() => {
              if (onDetectHiddenRelationships) onDetectHiddenRelationships(entity.id);
              else onFindPathFromNode(entity.id);
            }}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-600/60 text-cyan-300 text-xs font-semibold transition-all"
          >
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hidden Paths</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Draft Warrant */}
          <button
            onClick={() => onGenerateAffidavit(entity.id)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Legal Affidavit</span>
          </button>

          {/* Ask Copilot */}
          <button
            onClick={() => onAskCopilot(entity)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
