import { LayoutGrid, Smartphone, Image as ImageIcon, Sliders, Sun, Layers, Blend, PenLine } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type Tab = 'presets' | 'device' | 'background' | 'canvas' | 'lighting' | 'template' | 'overlay' | 'annotate';

export const TAB_ICONS: { id: Tab; icon: React.ComponentType<LucideProps>; label: string }[] = [
  { id: 'presets',    icon: LayoutGrid, label: 'Presets'    },
  { id: 'template',   icon: Layers,     label: 'Templates'  },
  { id: 'device',     icon: Smartphone, label: 'Device'     },
  { id: 'background', icon: ImageIcon,  label: 'Background' },
  { id: 'overlay',    icon: Blend,      label: 'Overlay'    },
  { id: 'annotate',   icon: PenLine,    label: 'Annotate'   },
  { id: 'canvas',     icon: Sliders,    label: 'Scene'      },
  { id: 'lighting',   icon: Sun,        label: 'Lighting'   },
];
