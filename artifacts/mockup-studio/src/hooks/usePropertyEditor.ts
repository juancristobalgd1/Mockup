import { useState } from 'react';

export type AnnotateProp = 'size' | 'opacity' | 'color' | 'hardness' | 'more' | null;
export type OverlayProp = 'color' | 'opacity' | 'light' | 'more' | null;
export type BackgroundProp = 'color' | 'opacity' | 'blur' | 'more' | 'radius' | null;
export type PatternsProp = 'color' | 'opacity' | 'scale' | 'more' | null;
export type DeviceProp = 'color' | 'shadow' | 'more' | 'estudio' | 'luz' | 'motion' | 'effects' | null;

export function usePropertyEditor() {
  const [annotateProperty, setAnnotateProperty] = useState<AnnotateProp>(null);
  const [overlayProperty, setOverlayProperty] = useState<OverlayProp>(null);
  const [backgroundProperty, setBackgroundProperty] = useState<BackgroundProp>(null);
  const [patternsProperty, setPatternsProperty] = useState<PatternsProp>(null);
  const [deviceProperty, setDeviceProperty] = useState<DeviceProp>(null);

  // Helper to close all properties
  const closeAllProperties = () => {
    setAnnotateProperty(null);
    setOverlayProperty(null);
    setBackgroundProperty(null);
    setPatternsProperty(null);
    setDeviceProperty(null);
  };

  return {
    annotateProperty,
    setAnnotateProperty,
    overlayProperty,
    setOverlayProperty,
    backgroundProperty,
    setBackgroundProperty,
    patternsProperty,
    setPatternsProperty,
    deviceProperty,
    setDeviceProperty,
    closeAllProperties
  };
}
