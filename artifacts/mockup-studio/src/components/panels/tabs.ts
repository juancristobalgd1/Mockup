import * as React from 'react';
import { LayoutGrid, Smartphone, Image as ImageIcon, Sliders, Layers, Blend, PenLine, Tags } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type Tab = 'presets' | 'device' | 'background' | 'canvas' | 'labels' | 'template' | 'overlay' | 'annotate';

export const TAB_ICONS: { id: Tab; icon: React.ComponentType<LucideProps>; label: string }[] = [
  { id: 'presets',    icon: LayoutGrid, label: 'Preajustes' },
  { id: 'template',   icon: Layers,     label: 'Plantillas' },
  { id: 'device',     icon: Smartphone, label: 'Dispositivo'},
  { id: 'background', icon: ImageIcon,  label: 'Fondo'      },
  { id: 'overlay',    icon: Blend,      label: 'Efectos'    },
  { id: 'annotate',   icon: PenLine,    label: 'Anotar'     },
  { id: 'canvas',     icon: Sliders,    label: 'Escena'     },
  { id: 'labels',     icon: Tags,       label: 'Etiquetas'  },
];
