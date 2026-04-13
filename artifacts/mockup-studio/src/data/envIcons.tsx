import * as React from 'react';
import { 
  Lamp, Warehouse, Building2, Sunset, TreePine, Moon 
} from 'lucide-react';

export const ENV_ICON: Record<string, React.ReactNode> = {
  studio:    <Lamp size={18} />,
  warehouse: <Warehouse size={18} />,
  city:      <Building2 size={18} />,
  sunset:    <Sunset size={18} />,
  forest:    <TreePine size={18} />,
  night:     <Moon size={18} />,
};
