import React from 'react';
import {
  Network,
  Crown,
  Target,
  Zap,
  FileSpreadsheet,
  History,
  Route,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Plus,
  FileDown,
  FolderLock,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { InvestigationCase, Entity } from '../../types';
import { TabView } from './NavigationTabs';

interface SidebarProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentCase: InvestigationCase;
  cases: InvestigationCase[];
  onSelectCase: (c: InvestigationCase) => void;
  nodesCount: number;
  targetsCount: number;
  evidenceLogsCount: number;
  onOpenAddEvidence: () => void;
  onExportReport: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  category: 'INVESTIGATION' | 'EVIDENCE' | 'INTELLIGENCE';
  description: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  currentCase,
  cases,
  onSelectCase,
  nodesCount,
  targetsCount,
  evidenceLogsCount,
  onOpenAddEvidence,
  onExportReport,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [showCaseSelector, setShowCaseSelector] = React.useState(false);

  const navItems: NavItem[] = [
    {
      id: 'graph',
      label: 'Network Graph Studio',
      shortLabel: 'Graph',
      icon: Network,
      badge: nodesCount.toString(),
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      category: 'INVESTIGATION',
      description: 'Interactive Multi-Modal Topology & Centrality',
    },
    {
      id: 'kingpin',
      label: 'Potential Kingpin Detection',
      shortLabel: 'Kingpin',
      icon: Crown,
      badge: 'Lead',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
      category: 'INVESTIGATION',
      description: 'Strategic Network Influence & Control Node Lead',
    },
    {
      id: 'prioritization',
      label: 'Target Prioritization',
      shortLabel: 'Priority',
      icon: Target,
      badge: targetsCount.toString(),
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
      category: 'INVESTIGATION',
      description: 'Kingpin & Facilitator Centrality Leaderboard',
    },
    {
      id: 'hidden_relationships',
      label: 'Hidden Relationships',
      shortLabel: 'Hidden',
      icon: Route,
      badge: '6-Hop',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
      category: 'INVESTIGATION',
      description: 'Indirect Multi-Hop Obfuscation Analysis',
    },
    {
      id: 'simulation',
      label: 'Disruption Simulator',
      shortLabel: 'Simulation',
      icon: Zap,
      badge: 'What-If',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
      category: 'INVESTIGATION',
      description: 'Counterfactual Network Fragmentation Analysis',
    },
    {
      id: 'ingestion',
      label: 'Evidence Fusion',
      shortLabel: 'Evidence',
      icon: FileSpreadsheet,
      badge: evidenceLogsCount.toString(),
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      category: 'EVIDENCE',
      description: 'Multi-Modal Parser & Real-Time Correlation',
    },
    {
      id: 'timeline',
      label: 'Timeline & Money Flow',
      shortLabel: 'Timeline',
      icon: History,
      category: 'EVIDENCE',
      description: 'Chronological Telemetry Scrubber',
    },
    {
      id: 'case_dossier',
      label: 'Case Dossier',
      shortLabel: 'Dossier',
      icon: FileText,
      category: 'EVIDENCE',
      description: 'Cryptographic Audit & Evidence Repository',
    },
    {
      id: 'ai_briefing',
      label: 'AI Investigation Copilot',
      shortLabel: 'Copilot',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-300 border-cyan-500/40',
      category: 'INTELLIGENCE',
      description: 'Investigation-Aware Assistant & Strategic MO Analysis',
    },
  ];

  const categories = [
    { key: 'INVESTIGATION', label: 'CORE ANALYSIS' },
    { key: 'EVIDENCE', label: 'EVIDENCE & TELEMETRY' },
    { key: 'INTELLIGENCE', label: 'AI COPILOT' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="global-sidebar"
        className={`
          fixed md:relative top-0 bottom-0 left-0 z-50 md:z-30
          flex flex-col h-full bg-[#070b14] border-r border-slate-800/90
          transition-all duration-300 ease-in-out select-none
          ${
            isMobileOpen
              ? 'translate-x-0 w-72 shadow-2xl'
              : '-translate-x-full md:translate-x-0'
          }
          ${
            !isMobileOpen && isCollapsed
              ? 'md:w-18 md:min-w-[72px] md:max-w-[72px]'
              : 'md:w-64 md:min-w-[256px] md:max-w-[256px]'
          }
        `}
      >
        {/* Top Header: Brand & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-950/80 flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-cyan-950/60 border border-cyan-400/30 flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent truncate">
                    NetTrace
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/60 font-semibold flex-shrink-0">
                    INTEL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate -mt-0.5">
                  Investigation Platform
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          <button
            id="sidebar-collapse-toggle-btn"
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-cyan-300 transition-colors flex-shrink-0"
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              id="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Active Investigation Switcher */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40 flex-shrink-0 relative">
          {(!isCollapsed || isMobileOpen) ? (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Active Target</span>
                <span className="text-cyan-400 font-mono text-[9px] font-bold">{currentCase.caseNumber}</span>
              </div>
              <button
                id="sidebar-case-dropdown-btn"
                onClick={() => setShowCaseSelector(!showCaseSelector)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left group"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <FolderLock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-200">
                      {currentCase.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-400 font-medium">
                        ${(currentCase.totalMonitoredFundsUSD / 1000000).toFixed(1)}M USD
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ml-1.5 ${
                    showCaseSelector ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showCaseSelector && (
                <div className="absolute left-3 right-3 mt-1 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Switch Case Investigation
                  </div>
                  {cases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCase(c);
                        setShowCaseSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start space-x-2.5 transition-colors hover:bg-slate-800 ${
                        c.id === currentCase.id ? 'bg-cyan-950/60 text-cyan-200' : 'text-slate-300'
                      }`}
                    >
                      <div className="mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            c.id === currentCase.id ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                        <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-0.5">
                          <span>{c.caseNumber}</span>
                          <span className="text-cyan-400 font-medium">
                            ${(c.totalMonitoredFundsUSD / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                id="sidebar-collapsed-case-btn"
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors"
                title={`${currentCase.title} (${currentCase.caseNumber})`}
              >
                <FolderLock className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          {categories.map((cat) => {
            const items = navItems.filter((i) => i.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <div className="px-2 py-1 text-[10px] font-mono tracking-wider text-slate-500 font-semibold uppercase">
                    {cat.label}
                  </div>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        onTabChange(item.id);
                        if (isMobileOpen && onCloseMobile) onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center rounded-xl transition-all group relative
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-200 border border-cyan-500/50 shadow-md shadow-cyan-950/40 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                        }
                        ${
                          !isCollapsed || isMobileOpen
                            ? 'px-3 py-2.5 justify-between'
                            : 'p-2.5 justify-center'
                        }
                      `}
                      title={isCollapsed ? `${item.label}: ${item.description}` : item.description}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`
                            p-1.5 rounded-lg transition-colors flex-shrink-0
                            ${
                              isActive
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                                : 'bg-slate-900/80 text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-850'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                          <span className="text-xs truncate tracking-tight text-left">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {/* Badge / Indicator */}
                      {(!isCollapsed || isMobileOpen) ? (
                        item.badge ? (
                          <span
                            className={`
                              text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ml-2 border
                              ${item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'}
                            `}
                          >
                            {item.badge}
                          </span>
                        ) : null
                      ) : (
                        isActive && (
                          <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )
                      )}

                      {/* Hover Tooltip when Collapsed */}
                      {isCollapsed && !isMobileOpen && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs font-sans rounded-lg shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 font-medium">
                          {item.label}
                          {item.badge && (
                            <span className="ml-1.5 text-[10px] font-mono text-cyan-400">
                              ({item.badge})
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Quick Actions & System Health Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 flex-shrink-0 space-y-2">
          {(!isCollapsed || isMobileOpen) ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="sidebar-quick-evidence-btn"
                  onClick={onOpenAddEvidence}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-all"
                  title="Add Forensic Evidence"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">Evidence</span>
                </button>
                <button
                  id="sidebar-quick-export-btn"
                  onClick={onExportReport}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-950/40"
                  title="Export Intelligence Dossier"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="truncate">Export</span>
                </button>
              </div>

              {/* Status footer banner */}
              <div className="px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center space-x-1.5 truncate">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate text-emerald-400">AUDIT VERIFIED</span>
                </div>
                <span className="text-amber-400 font-bold flex-shrink-0">TLP:AMBER</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                id="sidebar-collapsed-evidence-btn"
                onClick={onOpenAddEvidence}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors"
                title="Add Forensic Evidence"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                id="sidebar-collapsed-export-btn"
                onClick={onExportReport}
                className="w-10 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white transition-colors shadow-md shadow-cyan-950/40"
                title="Export Intelligence Dossier"
              >
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
