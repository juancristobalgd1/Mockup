import type { DeviceColor } from '../store';

export const IPHONE_COLORS: { id: DeviceColor; label: string; bg: string; border: string }[] = [
  { id: 'original',     label: 'Original',    bg: 'conic-gradient(from 0deg, #ff4d4d, #f9cb28, #7cfc00, #00ffff, #4d4dff, #ff00ff, #ff4d4d)', border: '#fff' },
  { id: 'titanium',     label: 'Titanium',    bg: 'linear-gradient(135deg, #3a3a3a, #1e1e1e)', border: '#555'    },
  { id: 'black',        label: 'Black',       bg: 'linear-gradient(135deg, #1a1a1a, #050505)', border: '#333'    },
  { id: 'white',        label: 'White',       bg: 'linear-gradient(135deg, #d8d8d8, #b0b0b0)', border: '#aaa'    },
  { id: 'blue',         label: 'Blue',        bg: 'linear-gradient(135deg, #2a3f6f, #0f1e40)', border: '#3a5080' },
  { id: 'naturallight', label: 'Natural',     bg: 'linear-gradient(135deg, #c2b8a3, #a8a090)', border: '#a89c8a' },
  { id: 'desert',       label: 'Desert',      bg: 'linear-gradient(135deg, #9c8878, #7a6858)', border: '#8a7868' },
  { id: 'sierra',       label: 'Sierra',      bg: 'linear-gradient(135deg, #6b8ca3, #4a6e8a)', border: '#5a7a90' },
];

export const ENV_PRESETS: { id: 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night'; label: string }[] = [
  { id: 'studio',    label: 'Studio'    },
  { id: 'warehouse', label: 'Warehouse' },
  { id: 'city',      label: 'City'      },
  { id: 'sunset',    label: 'Sunset'    },
  { id: 'forest',    label: 'Forest'    },
  { id: 'night',     label: 'Night'     },
];

export const CANVAS_RATIOS = [
  { id: 'free',  label: 'Free'  },
  { id: '1:1',   label: '1:1'   },
  { id: '4:5',   label: '4:5'   },
  { id: '16:9',  label: '16:9'  },
  { id: '9:16',  label: '9:16'  },
] as const;

export const PRESENT_POSES: {
  id: 'hero' | 'front' | 'side' | 'top' | 'tilt-right' | 'tilt-left' | 'low' | 'diagonal' | 'dramatic';
  label: string;
  ry: number; rx: number; rz: number;
  perspective?: number;
}[] = [
  { id: 'hero',       label: 'Hero',     ry:  25, rx: -12, rz:  0 },
  { id: 'front',      label: 'Front',    ry:   0, rx:   0, rz:  0 },
  { id: 'tilt-right', label: 'Right',    ry:  48, rx:  -8, rz:  0 },
  { id: 'tilt-left',  label: 'Left',     ry: -48, rx:  -8, rz:  0 },
  { id: 'top',        label: 'Top',      ry:  12, rx: -58, rz:  0 },
  { id: 'low',        label: 'Low',      ry:  14, rx:  42, rz:  0 },
  { id: 'side',       label: 'Side',     ry:  76, rx:   0, rz:  0 },
  { id: 'diagonal',   label: 'Diagonal', ry:  44, rx: -16, rz:  0 },
  { id: 'dramatic',   label: 'Dramatic', ry:  20, rx: -38, rz:  0 },
];

export const LABEL_SHADOW = '0 1px 5px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.7)';
