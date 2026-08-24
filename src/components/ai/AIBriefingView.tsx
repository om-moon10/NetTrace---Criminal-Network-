import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Copy, 
  Check, 
  FileDown, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Scale,
  Crown
} from 'lucide-react';
import { InvestigationCase, Entity, IntelligenceBrief } from '../../types';

interface AIBriefingViewProps {
  currentCase: InvestigationCase;
  onOpenAffidavitModal: (nodeId?: string) => void;
}

export const AIBriefingView: React.FC<AIBriefingViewProps> = ({
  currentCase,
  onOpenAffidavitModal,
}) => {
  const [briefing, setBriefing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copilotMessages, setCopilotMessages] = useState<{ sender: 'user' | 'copilot'; text: string; time: string }[]>([
    {
      sender: 'copilot',
      text: `Hello Special Agent. I am **NetTrace AI Copilot**. I have analyzed **${currentCase.title}** across ${currentCase.nodes.length} entities and ${currentCase.edges.length} correlated links.\n\nYou can ask me about suspect attribution, money flow conduits, disruption strategies, or draft legal search warrants.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate or refresh AI Briefing
  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: currentCase.id }),
      });
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to generate briefing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBriefing();
  }, [currentCase.id]);

  const handleSendCopilotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;

    const userMsg = copilotInput.trim();
    setCopilotInput('');
    setCopilotMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setIsCopilotThinking(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: currentCase.id,
          userQuery: userMsg,
        }),
      });
      const data = await res.json();
      setCopilotMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: data.reply || 'Analysis complete.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Error processing intelligence query. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const copyBriefing = () => {
    if (!briefing) return;
    const text = `# ${briefing.title}\nConfidence: ${briefing.confidenceScore}%\n\n## Executive Summary\n${briefing.summary}\n\n## Key Findings\n${briefing.keyFindings?.map((f: string) => `- ${f}`).join('\n')}\n\n## Recommended Warrants\n${briefing.recommendedWarrants?.map((w: any) => `- Target: ${w.target}\n  Jurisdiction: ${w.jurisdiction}\n  Justification: ${w.justification}`).join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              AI Syndicate Intelligence Assessment & Legal Decision Support
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Powered by Gemini AI reasoning engine for criminal attribution, MO synthesis, and affidavit drafting.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchBriefing}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Brief</span>
          </button>

          <button
            onClick={copyBriefing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-950/50"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Brief</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Executive Briefing, Right AI Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Executive Assessment Document */}
        <div className="lg:col-span-2 space-y-5">
          {isLoading ? (
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin-slow mx-auto" />
              <div className="text-sm font-bold text-slate-200">
                Gemini Reasoning Engine Analyzing Network Topology...
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Synthesizing Modus Operandi, identifying single points of failure, and drafting warrant packages.
              </p>
            </div>
          ) : briefing ? (
            <div className="bg-slate-900/95 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
              {/* Document Title Header */}
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                    LAW ENFORCEMENT BRIEFING
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">{briefing.title}</h2>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Case: {currentCase.caseNumber} • Generated:{' '}
                    {new Date(briefing.generatedAt || Date.now()).toUTCString()}
                  </div>
                </div>

                <div className="text-right font-mono text-xs bg-slate-950 p-2 rounded border border-slate-850">
                  <div className="text-slate-400 text-[10px]">ANALYSIS CONFIDENCE</div>
                  <div className="text-emerald-400 font-bold text-base">
                    {briefing.confidenceScore || 96}%
                  </div>
                </div>
              </div>

              {/* Section 1: Executive Summary & MO */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" /> 1. Executive Summary & Modus Operandi (MO)
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-slate-850 font-sans">
                  {briefing.summary}
                </p>
              </div>

              {/* Section 2: Key Operational Findings */}
              {briefing.keyFindings && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" /> 2. Key Operational & Forensics Findings
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {briefing.keyFindings.map((finding: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3 rounded-lg border border-slate-850 flex items-start space-x-2.5 text-slate-200"
                      >
                        <span className="w-5 h-5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-center leading-5 font-bold flex-shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Recommended Subpoenas & Warrants */}
              {briefing.recommendedWarrants && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-purple-400" /> 3. Recommended Subpoena & Search Warrant Priorities
                    </h3>
                    <button
                      onClick={() => onOpenAffidavitModal()}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      + Draft Custom Affidavit
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {briefing.recommendedWarrants.map((warrant: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 text-xs">{warrant.target}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                              warrant.urgency === 'critical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                : 'bg-amber-950 text-amber-300 border border-amber-700'
                            }`}
                          >
                            {warrant.urgency} URGENCY
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Jurisdiction: <span className="text-slate-200">{warrant.jurisdiction}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1 border-t border-slate-850">
                          {warrant.justification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Disruption Sequence Roadmap */}
              {briefing.interdictionRoadmap && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-emerald-400" /> 4. Disruption & Interdiction Phasing Roadmap
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {briefing.interdictionRoadmap.map((step: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3 rounded-lg border border-slate-850 flex items-start space-x-2.5 text-slate-200"
                      >
                        <span className="w-5 h-5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-center leading-5 font-bold flex-shrink-0 text-[10px]">
                          P{idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Col: Interactive Copilot Chat */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl flex flex-col h-[700px]">
          {/* Copilot Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <div>
                <span className="font-bold text-xs text-slate-200">Investigator AI Copilot</span>
                <div className="text-[10px] font-mono text-slate-400">Context: {currentCase.caseNumber}</div>
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              GEMINI 3.7
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {copilotMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none font-mono text-[11px]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            {isCopilotThinking && (
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Querying network graph and synthesizing reasoning...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendCopilotMessage}
            className="p-3 bg-slate-950 border-t border-slate-800 rounded-b-xl flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask copilot about targets, flows, or strategy..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isCopilotThinking || !copilotInput.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
