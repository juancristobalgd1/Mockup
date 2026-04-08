export interface LightOverlay {
  id: string;
  label: string;
  background: string;
  filter?: string;
}

function encSvg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const TREE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420">
  <rect width="320" height="420" fill="white"/>
  <rect x="146" y="180" width="28" height="240" rx="4" fill="black"/>
  <path d="M160 195 Q80 140 30 60" stroke="black" stroke-width="20" fill="none" stroke-linecap="round"/>
  <path d="M30 60 Q10 20 0 0" stroke="black" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M30 60 Q60 15 90 5" stroke="black" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M160 195 Q240 140 290 60" stroke="black" stroke-width="20" fill="none" stroke-linecap="round"/>
  <path d="M290 60 Q310 20 320 0" stroke="black" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M290 60 Q260 15 230 5" stroke="black" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M160 230 Q110 180 70 140" stroke="black" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M70 140 Q40 115 20 100" stroke="black" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M70 140 Q90 105 110 90" stroke="black" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M160 230 Q210 180 250 140" stroke="black" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M250 140 Q280 115 300 100" stroke="black" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M250 140 Q230 105 210 90" stroke="black" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M160 270 Q130 230 105 200" stroke="black" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M160 270 Q190 230 215 200" stroke="black" stroke-width="10" fill="none" stroke-linecap="round"/>
</svg>`;

const PLANT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420">
  <rect width="320" height="420" fill="white"/>
  <rect x="150" y="260" width="20" height="160" rx="6" fill="black"/>
  <ellipse cx="160" cy="200" rx="80" ry="120" fill="black" transform="rotate(-20 160 200)"/>
  <ellipse cx="220" cy="240" rx="55" ry="90" fill="black" transform="rotate(30 220 240)"/>
  <ellipse cx="100" cy="240" rx="55" ry="90" fill="black" transform="rotate(-30 100 240)"/>
  <ellipse cx="260" cy="190" rx="40" ry="70" fill="black" transform="rotate(50 260 190)"/>
  <ellipse cx="60" cy="190" rx="40" ry="70" fill="black" transform="rotate(-50 60 190)"/>
  <ellipse cx="160" cy="120" rx="50" ry="80" fill="black" transform="rotate(-5 160 120)"/>
</svg>`;

export const LIGHT_OVERLAYS: LightOverlay[] = [
  {
    id: 'blinds-sharp',
    label: 'Blinds',
    background: 'repeating-linear-gradient(-55deg, #000 0px, #000 14px, #fff 14px, #fff 34px)',
  },
  {
    id: 'blinds-soft',
    label: 'Soft',
    background: 'repeating-linear-gradient(-55deg, rgba(0,0,0,0.92) 0px, rgba(0,0,0,0.92) 14px, rgba(255,255,255,0.96) 14px, rgba(255,255,255,0.96) 34px)',
    filter: 'blur(7px)',
  },
  {
    id: 'tree',
    label: 'Tree',
    background: encSvg(TREE_SVG),
  },
  {
    id: 'plant',
    label: 'Plant',
    background: encSvg(PLANT_SVG),
  },
  {
    id: 'blinds-wide',
    label: 'Wide',
    background: 'repeating-linear-gradient(-50deg, #000 0px, #000 24px, #fff 24px, #fff 60px)',
  },
  {
    id: 'blinds-angled',
    label: 'Angled',
    background: 'repeating-linear-gradient(-70deg, #000 0px, #000 10px, #fff 10px, #fff 28px)',
  },
  {
    id: 'hatch',
    label: 'Cross',
    background: `repeating-linear-gradient(-45deg, #000 0px, #000 5px, transparent 5px, transparent 24px),
      repeating-linear-gradient(45deg, #000 0px, #000 5px, transparent 5px, transparent 24px), #fff`,
  },
];
