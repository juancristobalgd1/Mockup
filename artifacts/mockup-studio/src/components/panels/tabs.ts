import { LayoutGrid, Smartphone, Image as ImageIcon, Sliders, Sun, Type, Layers } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type Tab = 'presets' | 'device' | 'background' | 'canvas' | 'lighting' | 'text' | 'template';

export const TAB_ICONS: { id: Tab; icon: React.ComponentType<LucideProps>; label: string }[] = [
  { id: 'presets',    icon: LayoutGrid, label: 'Presets'    },
  { id: 'template',   icon: Layers,     label: 'Templates'  },
  { id: 'device',     icon: Smartphone, label: 'Device'     },
  { id: 'background', icon: ImageIcon,  label: 'Background' },
  { id: 'canvas',     icon: Sliders,    label: 'Scene'      },
  { id: 'lighting',   icon: Sun,        label: 'Lighting'   },
  { id: 'text',       icon: Type,       label: 'Text'       },
];
