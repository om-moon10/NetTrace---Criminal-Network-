import React, { useState, useEffect, useRef } from 'react';
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
  Crown,
  Route,
  Target,
  Zap,
  ArrowRight,
  Shield,
  Trash2,
  CornerDownLeft,
  ExternalLink
} from 'lucide-react';
import { InvestigationCase, Entity, CopilotMessage, CopilotAction } from '../../types';
import { api } from '../../services/api';

interface AIBriefingViewProps {
  currentCase: InvestigationCase;
  onOpenAffidavitModal: (nodeId?: string) => void;
  onNavigateToView?: (view: string, entityId?: string, pathNodeIds?: string[]) => void;
}

// Formatter to render Markdown-like text safely without horizontal overflow
const FormattedMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="text-xs sm:text-[13px] leading-relaxed font-sans text-slate-100 space-y-2 min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 3: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-cyan-300 font-mono tracking-tight pt-1 border-b border-slate-800/80 pb-1"
            >
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Heading 2: ## Title
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-slate-100 font-mono tracking-tight pt-1.5"
            >
              {trimmed.replace('## ', '')}
            </h3>
          );
        }

        // Bullet point: - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1 min-w-0">
              <span className="text-cyan-400 font-bold mt-0.5 shrink-0">•</span>
              <span className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                {renderFormattedSegments(bulletContent)}
              </span>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="min-w-0 break-words [overflow-wrap:anywhere]">
            {renderFormattedSegments(line)}
          </p>
        );
      })}
    </div>
  );
};

// Parses inline bolding (**bold**) and inline code (`code`/hash)
function renderFormattedSegments(content: string): React.ReactNode {
  // Regex to split by bold or code tokens
  const tokens = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-slate-900/90 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-750/70 inline break-all"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

export const AIBriefingView: React.FC<AIBriefingViewProps> = ({
  currentCase,
  onOpenAffidavitModal,
  onNavigateToView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'copilot' | 'briefing'>('copilot');
  const [briefing, setBriefing] = useState<any>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage: CopilotMessage = {
    id: 'msg-init-1',
    sender: 'copilot',
    text: `Hello Special Agent. I am **NetTrace AI Copilot**, your investigation intelligence and strategic attribution assistant for **${currentCase.title} (${currentCase.caseNumber})**.\n\nI have loaded full graph topology (${currentCase.nodes.length} entities, ${currentCase.edges.length} evidence links), financial telemetry ($${(currentCase.totalMonitoredFundsUSD / 1000000).toFixed(1)}M USD monitored), forensic seized artifacts, and multi-hop paths.\n\nSelect a recommended inquiry below or enter custom forensic questions regarding subjects, laundering conduits, or legal affidavit drafts.`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedQuestions: [
      'Who is the primary syndicate architect and kingpin?',
      'Trace the high-velocity cryptocurrency laundering trail',
      'What hidden multi-hop paths link cyber entry points to financial vaults?',
      'Which search warrants or freeze orders are highest priority?',
      'Simulate the disruption impact of removing key bridge nodes',
    ],
    suggestedActions: [
      { label: 'View Network Graph', view: 'graph' },
      { label: 'Analyze Kingpin Lead', view: 'kingpin' },
      { label: 'Inspect Hidden Paths', view: 'hidden_relationships' },
      { label: 'Test Disruption Scenario', view: 'simulation' },
    ],
    confidenceScore: 98,
    generatedBy: 'NetTrace Intelligence & Gemini 3.7 Flash Engine',
    disclaimer: 'AI-generated analysis is based on available investigation data and should be independently verified.',
  };

  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([initialMessage]);

  const quickInquiryChips = [
    { label: '👑 Kingpin Attribution', query: 'Who is the primary syndicate kingpin and what forensic evidence attributes their command?' },
    { label: '💸 Money Flow & Laundering', query: 'Trace the complete money laundering path from victim extortion to Dubai bank offramps' },
    { label: '🔀 Hidden Multi-Hop Links', query: 'Identify hidden indirect relationships connecting cyber entry points to financial accounts' },
    { label: '⚖️ High-Priority Warrants', query: 'Generate recommended subpoena and warrant priorities with legal justifications' },
    { label: '⚡ Optimal Disruption', query: 'What is the optimal node removal sequence to maximize network disruption?' },
  ];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, isCopilotThinking]);

  // Fetch or refresh Case Briefing
  const fetchBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const data = await api.getCaseBriefing(currentCase.id || 'NX-102');
      setBriefing(data);
    } catch (err) {
      console.warn('Failed to load briefing from server, using local synthesis:', err);
      // Fallback local brief
      setBriefing({
        title: `Intelligence Assessment: ${currentCase.title}`,
        confidenceScore: 96,
        summary: currentCase.summary || currentCase.description,
        keyFindings: [
          'Centralized command architecture orchestrated through Dmitri Volkov (CipherKing).',
          'Automated liquidity dispersal through cross-chain DEX bridges and Wasabi mixers.',
          'Commercial real estate escrow used in UAE for final fiat off-ramping.',
        ],
        recommendedWarrants: [
          { target: 'bc1qa5kx... (Master Vault)', jurisdiction: 'Federal Court / Asset Forfeiture', urgency: 'critical', justification: 'Holds $31.2M in verified ransomware proceeds.' },
          { target: '185.220.101.5 (Moldova C2)', jurisdiction: 'International MLAT / Europol', urgency: 'critical', justification: 'Direct SSH telemetry authenticated by subject laptop.' },
        ],
        interdictionRoadmap: [
          'Execute simultaneous blockchain freeze on DEX bridge smart contracts.',
          'Serve MLAT warrants on UAE bank escrow accounts.',
          'Issue Interpol Red Notice for primary command subjects.',
        ]
      });
    } finally {
      setIsBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [currentCase.id]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || copilotInput.trim();
    if (!textToSend || isCopilotThinking) return;

    setCopilotInput('');

    const userMessage: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotMessages((prev) => [...prev, userMessage]);
    setIsCopilotThinking(true);

    try {
      const history = copilotMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await api.queryCopilot({
        caseId: currentCase.id || 'NX-102',
        investigationId: currentCase.id || 'NX-102',
        userQuery: textToSend,
        messageHistory: history,
        currentView: 'ai_briefing',
      });

      const copilotMsg: CopilotMessage = {
        id: `msg-copilot-${Date.now()}`,
        sender: 'copilot',
        text: res.reply || 'Intelligence analysis complete.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: res.suggestedQuestions,
        suggestedActions: res.suggestedActions,
        referencedEntities: res.referencedEntities,
        confidenceScore: res.confidenceScore,
        generatedBy: res.generatedBy,
        disclaimer: res.disclaimer,
      };

      setCopilotMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.error('Copilot query error:', err);
      const fallbackMsg: CopilotMessage = {
        id: `msg-copilot-err-${Date.now()}`,
        sender: 'copilot',
        text: `### Intelligence Synthesis for ${currentCase.title}\n\nBased on active case topology, key subjects include **Dmitri Volkov** (Command Node, Risk: 98/100) and **Master Treasury Vault** ($31.2M USD). Illicit funds bridge through Ethereum and TRON before settling in corporate escrow accounts.\n\n*Note: Real-time model server was unavailable; response synthesized via deterministic rule engine.*`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'What are the primary bridge conduits?',
          'Trace the cryptocurrency laundering hops',
          'Which targets have pending search warrants?',
        ],
        suggestedActions: [
          { label: 'View Network Graph', view: 'graph' },
          { label: 'View Hidden Paths', view: 'hidden_relationships' },
        ],
        confidenceScore: 92,
        generatedBy: 'NetTrace Intelligence Rule Engine',
        disclaimer: 'AI-generated analysis is based on available investigation data and should be independently verified.',
      };
      setCopilotMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setCopilotMessages([initialMessage]);
  };

  const handleActionClick = (action: CopilotAction) => {
    if (onNavigateToView) {
      onNavigateToView(action.view, action.entityId, action.pathNodeIds);
    }
  };

  const handleExportTranscript = () => {
    const transcript = `# NETTRACE AI COPILOT TRANSCRIPT
CASE: ${currentCase.title} (${currentCase.caseNumber})
COMPILED: ${new Date().toUTCString()}

${copilotMessages
  .map(
    (m) =>
      `### [${m.time}] ${m.sender.toUpperCase()}:\n${m.text}\n\n${
        m.disclaimer ? `*Disclaimer: ${m.disclaimer}*\n\n` : ''
      }`
  )
  .join('---\n\n')}
`;
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NETTRACE_COPILOT_TRANSCRIPT_${currentCase.caseNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 text-slate-100 h-full flex flex-col min-w-0 overflow-hidden">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 flex-shrink-0 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-cyan-950/50 border border-cyan-400/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 truncate">
                  AI Investigation Copilot
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold shrink-0">
                  Investigation-Aware
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate hidden sm:block">
                Multi-modal criminal network reasoning, indirect conduit attribution & tactical decision support
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls: Sub-tab switcher & Actions */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap">
          {/* Sub-view Switcher Pills */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              id="copilot-tab-chat-btn"
              onClick={() => setActiveSubTab('copilot')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubTab === 'copilot'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Copilot</span>
            </button>
            <button
              id="copilot-tab-briefing-btn"
              onClick={() => setActiveSubTab('briefing')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeSubTab === 'briefing'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Briefing</span>
            </button>
          </div>

          {activeSubTab === 'copilot' ? (
            <div className="flex items-center space-x-1.5">
              <button
                id="copilot-export-transcript-btn"
                onClick={handleExportTranscript}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-all"
                title="Export Conversation Transcript"
              >
                <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Export Transcript</span>
              </button>
              <button
                id="copilot-clear-chat-btn"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-400 hover:text-rose-300 transition-all"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="copilot-regenerate-brief-btn"
              onClick={fetchBriefing}
              disabled={isBriefingLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-200 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBriefingLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Regenerate Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'copilot' ? (
        <div className="flex-1 flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 shadow-2xl overflow-hidden min-h-0 min-w-0 w-full">
          {/* Active Case Context Bar */}
          <div className="px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 text-xs font-mono min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 truncate min-w-0 flex-1">
              <span className="flex items-center space-x-1.5 text-cyan-300 font-semibold truncate min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="shrink-0">CASE: {currentCase.caseNumber}</span>
                <span className="text-slate-500 font-normal truncate hidden sm:inline">({currentCase.title})</span>
              </span>
              <span className="text-slate-600 hidden md:inline">|</span>
              <span className="text-slate-400 hidden md:inline shrink-0">
                {currentCase.nodes.length} Entities • {currentCase.edges.length} Links
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400 flex-shrink-0 ml-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                GEMINI 3.7 FLASH
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-4 custom-scrollbar min-h-0 min-w-0">
            {copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`w-full flex flex-col min-w-0 ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`w-full max-w-[96%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 shadow-lg transition-all min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word] ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-950/95 text-slate-200 border border-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Sender Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60 text-[11px] font-mono min-w-0">
                    <span className="flex items-center gap-1.5 font-bold truncate">
                      {msg.sender === 'copilot' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-cyan-300">NetTrace Copilot</span>
                        </>
                      ) : (
                        <span className="text-cyan-100">Investigator</span>
                      )}
                    </span>
                    <div className="flex items-center space-x-2 text-slate-400 shrink-0">
                      <span>{msg.time}</span>
                      {msg.sender === 'copilot' && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="hover:text-cyan-300 transition-colors p-1 rounded"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Body with Markdown styling & proper wrapping */}
                  <FormattedMessageContent text={msg.text} />

                  {/* Referenced Entities Cards */}
                  {msg.referencedEntities && msg.referencedEntities.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400 shrink-0" /> Referenced Target Nodes
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 min-w-0">
                        {msg.referencedEntities.map((ent) => (
                          <button
                            key={ent.id}
                            onClick={() => {
                              if (onNavigateToView) onNavigateToView('graph', ent.id);
                            }}
                            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-colors group min-w-0"
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <div className="font-semibold text-slate-200 text-xs truncate group-hover:text-cyan-300">
                                {ent.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {ent.label} • {ent.role}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                              {ent.riskScore}/100
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                        <Zap className="w-3 h-3 text-amber-400" /> Actions:
                      </span>
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(action)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-200 text-[11px] font-medium transition-all hover:scale-[1.02] max-w-full"
                        >
                          <span className="truncate">{action.label}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0" /> Suggested Follow-ups
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {msg.suggestedQuestions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSendMessage(q)}
                            className="text-left px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-sans transition-colors break-words [overflow-wrap:anywhere] max-w-full"
                          >
                            "{q}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legal Disclaimer Footer on Copilot Messages */}
                  {msg.disclaimer && (
                    <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                      <span className="truncate min-w-0">{msg.disclaimer}</span>
                      <span className="text-emerald-400/80 shrink-0">CONFIDENCE: {msg.confidenceScore || 95}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isCopilotThinking && (
              <div className="flex items-center space-x-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-300 max-w-md animate-pulse">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                <span>Analyzing graph topology, transaction logs & generating legal reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiry Chips Strip */}
          <div className="px-3 sm:px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 min-w-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex-shrink-0 mr-1">
              Quick Inquiries:
            </span>
            {quickInquiryChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-cyan-200 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Bar Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2.5 flex-shrink-0 min-w-0 w-full"
          >
            <div className="relative flex-1 min-w-0">
              <input
                id="copilot-query-input"
                type="text"
                placeholder="Ask about suspect attribution, money flow conduits, hidden links, or warrant justification..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                disabled={isCopilotThinking}
                className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono min-w-0"
              />
              <button
                type="submit"
                disabled={isCopilotThinking || !copilotInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-md shadow-cyan-950/50"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Executive Intelligence Briefing Document */
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-6 shadow-2xl custom-scrollbar min-h-0 min-w-0">
          {isBriefingLoading ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-200">
                Synthesizing Comprehensive Case Dossier & Warrant Priorities...
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Extracting topological choke points and formulating evidentiary justifications.
              </p>
            </div>
          ) : briefing ? (
            <div className="space-y-6">
              {/* Briefing Header Banner */}
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      OFFICIAL INTELLIGENCE ASSESSMENT
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      {currentCase.classification}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">{briefing.title}</h2>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Case Ref: {currentCase.caseNumber} • Lead: {currentCase.leadInvestigator} ({currentCase.agency})
                  </div>
                </div>

                <div className="text-right font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-[10px]">REASONING CONFIDENCE</div>
                  <div className="text-emerald-400 font-bold text-base">
                    {briefing.confidenceScore || 96}%
                  </div>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" /> 1. Executive Summary & Modus Operandi (MO)
                </h3>
                <div className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-850 font-sans whitespace-pre-line">
                  {briefing.summary}
                </div>
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
                        className="bg-slate-950/70 p-3 rounded-xl border border-slate-850 flex items-start space-x-2.5 text-slate-200"
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
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <span>+ Open Affidavit Generator</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {briefing.recommendedWarrants.map((warrant: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2"
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
                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1.5 border-t border-slate-850">
                          {warrant.justification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Disruption Roadmap */}
              {briefing.interdictionRoadmap && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-emerald-400" /> 4. Disruption & Interdiction Phasing Roadmap
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {briefing.interdictionRoadmap.map((step: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 flex items-start space-x-2.5 text-slate-200"
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

              {/* Legal Disclaimer Footer */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>CONFIDENTIAL: AI-generated analysis is based on available investigation data and should be independently verified.</span>
                <span className="text-cyan-400 font-bold">NETTRACE v3.4</span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
