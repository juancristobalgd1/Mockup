import * as React from 'react';
import { 
  Lamp, Warehouse, Building2, Sunset, TreePine, Moon 
} from 'lucide-react';

export const ENV_ICON: Record<string, React.ReactNode> = {
  studio:    <Lamp size={15} strokeWidth={2.2} />,
  warehouse: <Warehouse size={15} strokeWidth={2.2} />,
  city:      <Building2 size={15} strokeWidth={2.2} />,
  sunset:    <Sunset size={15} strokeWidth={2.2} />,
  forest:    <TreePine size={15} strokeWidth={2.2} />,
  night:     <Moon size={15} strokeWidth={2.2} />,
};
