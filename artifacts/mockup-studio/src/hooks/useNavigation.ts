import { useState, useEffect } from 'react';
import type { Tab } from '../components/panels/tabs';

export type DrillDownView = 'hub' | 'content' | 'shapes' | 'stickers';

export function useNavigation() {
  const [mobileTab, setMobileTab] = useState<Tab | "export" | null>(null);
  const [activeTab, setActiveTab] = useState<string>("template");
  
  // Drill-down states
  const [backgroundPanelView, setBackgroundPanelView] = useState<'hub' | 'content'>('hub');
  const [devicePanelView, setDevicePanelView] = useState<'hub' | 'content'>('hub');
  const [scenePanelView, setScenePanelView] = useState<'hub' | 'content'>('hub');
  const [labelsPanelView, setLabelsPanelView] = useState<'hub' | 'content'>('hub');
  const [annotatePanelView, setAnnotatePanelView] = useState<'hub' | 'shapes' | 'stickers'>('hub');
  
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [showGlobalMenu, setShowGlobalMenu] = useState(false);

  // Reset drill-down views when tab changes
  useEffect(() => {
    if (mobileTab === "background") setBackgroundPanelView('hub');
    if (mobileTab === "device") setDevicePanelView('hub');
    if (mobileTab === "canvas") setScenePanelView('hub');
    if (mobileTab === "labels") setLabelsPanelView('hub');
    if (mobileTab === "annotate") setAnnotatePanelView('hub');
  }, [mobileTab]);

  // Global menu click listener is handled separately in useWindowListeners
  // but the state lives here.

  return {
    mobileTab,
    setMobileTab,
    activeTab,
    setActiveTab,
    backgroundPanelView,
    setBackgroundPanelView,
    devicePanelView,
    setDevicePanelView,
    scenePanelView,
    setScenePanelView,
    labelsPanelView,
    setLabelsPanelView,
    annotatePanelView,
    setAnnotatePanelView,
    timelineCollapsed,
    setTimelineCollapsed,
    showGlobalMenu,
    setShowGlobalMenu,
  };
}
