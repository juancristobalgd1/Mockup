/**
 * Dynamic background asset registry.
 * Uses Vite's glob import to automatically detect all .webp files in the assets directories.
 * Adding a new .webp file to these folders will automatically make it available in the UI.
 */

const gradientModules = import.meta.glob('../assets/backgrounds/gradients/*.webp', { eager: true, import: 'default' });
const textureModules = import.meta.glob('../assets/backgrounds/textures/*.webp', { eager: true, import: 'default' });
const wallpaperModules = import.meta.glob('../assets/backgrounds/wallpapers/*.webp', { eager: true, import: 'default' });
const imageModules = import.meta.glob('../assets/backgrounds/images/*.webp', { eager: true, import: 'default' });

export const GRADIENT_ASSETS = Object.entries(gradientModules)
  .map(([path, url]: any) => {
    const filename = path.split('/').pop()?.replace('.webp', '') || '';
    return { 
      id: filename, 
      url: url as string 
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

export const TEXTURE_ASSETS = Object.entries(textureModules)
  .map(([path, url]: any) => {
    const filename = path.split('/').pop()?.replace('.webp', '') || '';
    return { 
      id: filename, 
      url: url as string 
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

export const WALLPAPER_ASSETS = [
  ...Object.entries(wallpaperModules),
  ...Object.entries(imageModules)
]
  .map(([path, url]: any) => {
    const filename = path.split('/').pop()?.replace('.webp', '') || '';
    return { 
      id: filename, 
      url: url as string 
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
