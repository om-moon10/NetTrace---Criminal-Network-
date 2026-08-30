import React, { useState, useRef, useEffect } from 'react';
import { 
  Network, 
  Target, 
  Zap, 
  FileSpreadsheet, 
  History, 
  BrainCircuit, 
  FileText,
  ChevronDown,
  Menu,
  Layers,
  Crown,
  Route
} from 'lucide-react';

export type TabView = 
  | 'graph'
  | 'kingpin'
  | 'prioritization'
  | 'simulation'
  | 'ingestion'
  | 'timeline'
  | 'hidden_relationships'
  | 'ai_briefing'
  | 'case_dossier';

interface NavigationTabsProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  nodesCount: number;
  targetsCount: number;
  evidenceLogsCount: number;
  onOpenMobileDrawer?: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  nodesCount,
  targetsCount,
  evidenceLogsCount,
  onOpenMobileDrawer,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const tabs = [
    {
      id: 'graph' as TabView,
      label: 'Network Graph',
      fullLabel: 'Network Graph Studio',
      icon: Network,
      badge: nodesCount.toString(),
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800',
      description: 'Interactive Multi-Modal Topology & Centrality',
      isPrimaryTablet: true,
    },
    {
      id: 'kingpin' as TabView,
      label: 'Kingpin Lead',
      fullLabel: 'Potential Kingpin Detection',
      icon: Crown,
      badge: 'Lead',
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800',
      description: 'Strategic Network Influence & Control Node Lead',
      isPrimaryTablet: true,
    },
    {
      id: 'prioritization' as TabView,
      label: 'Target Priority',
      fullLabel: 'Target Prioritization',
      icon: Target,
      badge: targetsCount.toString(),
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800',
      description: 'Kingpin & Facilitator Centrality Leaderboard',
      isPrimaryTablet: true,
    },
    {
      id: 'simulation' as TabView,
      label: 'Disruption Sim',
      fullLabel: 'Disruption Simulator',
      icon: Zap,
      badge: 'What-If',
      badgeColor: 'bg-amber-950 text-amber-400 border border-amber-800',
      description: 'Counterfactual Network Fragmentation Analysis',
      isPrimaryTablet: true,
    },
    {
      id: 'ingestion' as TabView,
      label: 'Evidence Fusion',
      fullLabel: 'Evidence Fusion & Ingestion',
      icon: FileSpreadsheet,
      badge: evidenceLogsCount.toString(),
      badgeColor: 'bg-indigo-950 text-indigo-300 border border-indigo-800',
      description: 'Multi-Modal Parser & Real-Time Correlation',
      isPrimaryTablet: true,
    },
    {
      id: 'timeline' as TabView,
      label: 'Timeline & Flow',
      fullLabel: 'Timeline & Money Flow',
      icon: History,
      description: 'Chronological Telemetry Scrubber',
      isPrimaryTablet: false,
    },
    {
      id: 'hidden_relationships' as TabView,
      label: 'Hidden Paths',
      fullLabel: 'Hidden Relationship Detection',
      icon: Route,
      badge: '6-Hop',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-700',
      description: 'Indirect Multi-Hop Obfuscation Analysis',
      isPrimaryTablet: false,
    },
    {
      id: 'ai_briefing' as TabView,
      label: 'AI Intelligence',
      fullLabel: 'AI Intelligence Briefing',
      icon: BrainCircuit,
      badge: 'Gemini',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-700',
      description: 'Syndicate MO & Legal Warrant Generator',
      isPrimaryTablet: false,
    },
    {
      id: 'case_dossier' as TabView,
      label: 'Case Dossier',
      fullLabel: 'Case Dossier & Chain of Custody',
      icon: FileText,
      description: 'Cryptographic Audit & Evidence Repository',
      isPrimaryTablet: false,
    },
  ];

  const primaryTabletTabs = tabs.filter((t) => t.isPrimaryTablet);
  const secondaryTabletTabs = tabs.filter((t) => !t.isPrimaryTablet);
  const isSecondaryActive = secondaryTabletTabs.some((t) => t.id === activeTab);
  const activeSecondaryItem = secondaryTabletTabs.find((t) => t.id === activeTab);
  const currentActiveTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-slate-950/95 border-b border-slate-800/80 px-3 sm:px-6 py-1.5 backdrop-blur-md sticky top-[69px] z-30">
      <div className="max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. DESKTOP VIEW (≥ 1280px / xl): Full Navigation without horizontal scroll */}
        {/* ========================================================================= */}
        <div className="hidden xl:flex items-center justify-between gap-1.5 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
                }`}
                title={tab.description}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.fullLabel}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold flex-shrink-0 ${
                      tab.badgeColor || (isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 2. TABLET VIEW (768px – 1279px / md to xl): Collapsed Secondary Menu      */}
        {/* ========================================================================= */}
        <div className="hidden md:flex xl:hidden items-center justify-between gap-1.5 w-full">
          {/* Primary visible tabs */}
          {primaryTabletTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tablet-tab-${tab.id}`}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsMoreMenuOpen(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent'
                }`}
                title={tab.description}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold flex-shrink-0 ${
                      tab.badgeColor || (isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Collapsible "More Views" Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              id="tablet-more-menu-btn"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap ${
                isSecondaryActive
                  ? 'bg-slate-900 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-slate-800'
              }`}
            >
              {isSecondaryActive && activeSecondaryItem ? (
                <>
                  <activeSecondaryItem.icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="max-w-[110px] truncate">{activeSecondaryItem.label}</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>More Intel</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMoreMenuOpen && (
              <div 
                id="tablet-more-dropdown"
                className="absolute right-0 mt-1.5 w-64 bg-slate-900 rounded-lg shadow-2xl border border-slate-700 py-1.5 z-50 divide-y divide-slate-800"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Additional Intelligence Modules
                </div>
                {secondaryTabletTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`more-dropdown-tab-${tab.id}`}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors hover:bg-slate-800 ${
                        isActive ? 'bg-cyan-950/50 text-cyan-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="truncate">{tab.fullLabel}</span>
                      </div>
                      {tab.badge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold flex-shrink-0 ml-2 ${tab.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MOBILE VIEW (< 768px / md:hidden): Compact Module Switcher Strip       */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between py-0.5">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex-shrink-0">
              Module:
            </span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-300 truncate">
              <currentActiveTabObj.icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{currentActiveTabObj.fullLabel}</span>
            </div>
          </div>

          <button
            id="mobile-open-drawer-btn"
            onClick={onOpenMobileDrawer}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-colors flex-shrink-0 ml-2"
          >
            <Menu className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Modules</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
