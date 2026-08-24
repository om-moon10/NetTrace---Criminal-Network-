import React, { useState } from 'react';
import { Plus, X, Shield, DollarSign, Activity } from 'lucide-react';
import { Entity, EvidenceEdge, EntityType, EntityRole, ThreatLevel, EdgeType } from '../../types';

interface AddEvidenceModalProps {
  isOpen: boolean;
  nodes: Entity[];
  onClose: () => void;
  onAddEntity: (entity: Entity) => void;
  onAddEdge: (edge: EvidenceEdge) => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  nodes,
  onClose,
  onAddEntity,
  onAddEdge,
}) => {
  const [tab, setTab] = useState<'entity' | 'edge'>('entity');

  // Entity fields
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>('crypto_wallet');
  const [role, setRole] = useState<EntityRole>('facilitator');
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('high');
  const [riskScore, setRiskScore] = useState<number>(85);
  const [country, setCountry] = useState('');
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Edge fields
  const [sourceId, setSourceId] = useState(nodes[0]?.id || '');
  const [targetId, setTargetId] = useState(nodes[1]?.id || '');
  const [edgeType, setEdgeType] = useState<EdgeType>('financial_transaction');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeValueUSD, setEdgeValueUSD] = useState<number>(1000000);
  const [protocol, setProtocol] = useState('');

  if (!isOpen) return null;

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !name.trim()) return;

    const newEntity: Entity = {
      id: `ent-custom-${Date.now()}`,
      label: label.trim(),
      name: name.trim(),
      type,
      threatLevel,
      role,
      riskScore,
      confidenceScore: 95,
      metadata: {
        country: country || undefined,
        balanceUSD: balanceUSD > 0 ? balanceUSD : undefined,
        totalVolumeUSD: balanceUSD > 0 ? balanceUSD * 2 : undefined,
        firstSeen: new Date().toISOString().split('T')[0],
        tags: ['Manual-Entry', 'Custom-Evidence'],
        notes: notes || undefined,
        status: 'active',
      },
    };

    onAddEntity(newEntity);
    onClose();
  };

  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    const newEdge: EvidenceEdge = {
      id: `edge-custom-${Date.now()}`,
      source: sourceId,
      target: targetId,
      type: edgeType,
      label: edgeLabel || (edgeType === 'financial_transaction' ? 'Fund Transfer' : 'Traffic Link'),
      value: edgeValueUSD,
      currency: 'USD',
      protocol: protocol || undefined,
      timestamp: new Date().toISOString(),
      confidence: 95,
      direction: 'unidirectional',
    };

    onAddEdge(newEdge);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 animate-scale-up">
        {/* Header with Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTab('entity')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tab === 'entity'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              + Add Node / Identifier
            </button>
            <button
              onClick={() => setTab('edge')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tab === 'edge'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              + Add Evidence Link / Edge
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {tab === 'entity' ? (
          <form onSubmit={handleCreateEntity} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Entity Identifier / Address / Hash / IP
              </label>
              <input
                type="text"
                placeholder="e.g. 0x88f4..., 185.220..., phantom-market.is"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Descriptive Name / Alias
              </label>
              <input
                type="text"
                placeholder="e.g. Primary Tumbler Output, Volkov Laptop IP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Entity Modality</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
                >
                  <option value="crypto_wallet">Crypto Wallet</option>
                  <option value="crypto_exchange">Crypto Exchange</option>
                  <option value="ip_address">IP Address</option>
                  <option value="server">Server / Infrastructure</option>
                  <option value="domain">Domain / Hostname</option>
                  <option value="person">Person of Interest</option>
                  <option value="organization">Corporate Front</option>
                  <option value="phone">Phone Number</option>
                  <option value="bank_account">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Syndicate Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
                >
                  <option value="kingpin">Kingpin / Leader</option>
                  <option value="facilitator">Facilitator</option>
                  <option value="money_launderer">Money Launderer</option>
                  <option value="c2_controller">C2 Controller</option>
                  <option value="infrastructure_provider">Infrastructure Provider</option>
                  <option value="mule">Smurfing Mule</option>
                  <option value="developer">Malware Developer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Threat Level</label>
                <select
                  value={threatLevel}
                  onChange={(e) => setThreatLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
                >
                  <option value="critical">Critical Threat</option>
                  <option value="high">High Threat</option>
                  <option value="medium">Medium Threat</option>
                  <option value="low">Low Threat</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Risk Score ({riskScore}/100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number(e.target.value))}
                  className="w-full accent-cyan-500 mt-2 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md mt-2"
            >
              Add Identifier to Investigation Graph
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateEdge} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source Node</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Node</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Relationship Type</label>
              <select
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
              >
                <option value="financial_transaction">Financial Transaction / Crypto Transfer</option>
                <option value="network_traffic">Network Traffic / SSH / C2 Heartbeat</option>
                <option value="communication">Encrypted Communication (Signal, Matrix)</option>
                <option value="ownership">Corporate / Account Beneficial Ownership</option>
                <option value="credential_overlap">Credential Overlap / Shared SSH Key</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Connection Label</label>
                <input
                  type="text"
                  placeholder="e.g. Wasabi Mix Outflow"
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Value (USD or Volume)</label>
                <input
                  type="number"
                  value={edgeValueUSD}
                  onChange={(e) => setEdgeValueUSD(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md mt-2"
            >
              Correlate Evidence Link in Graph
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
