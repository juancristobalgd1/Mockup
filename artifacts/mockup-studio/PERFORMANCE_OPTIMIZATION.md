# 3D Performance Optimization Guide

Esta guía describe cómo **Mockup Studio Pro** mantiene 60 fps estables en desktop, tablet y móvil. Implementación: `src/utils/performance.ts` + `src/components/devices3d/viewer/`.

---

## 🎯 Objetivo

Que toda la magia cinematográfica (SSAO, Bloom, depth of field, sombras, materiales PBR, post-FX) se vea bien en una pantalla Retina y, al mismo tiempo, **no derrita** un gama media-android.

Para eso se usa un sistema en dos capas:

1. **Perfilado del dispositivo** al cargar la app.
2. **Configuración adaptativa** que se inyecta al render pipeline y al pipeline de post-processing.

---

## 🧭 Cómo se detecta el dispositivo

Función `detectDeviceProfile()` en `src/utils/performance.ts:28`. Retorna:

```ts
interface DeviceProfile {
  isMobile: boolean;
  hasGPU: boolean;
  gpuMemory: number | null;     // MB estimados (cuando se puede leer del renderer)
  tier: 'low' | 'medium' | 'high';
}
```

Algoritmo:

1. **UA sniff**: `/mobile|android|iphone|ipad|tablet/.test(navigator.userAgent)` → `isMobile`.
2. **GPU probe**: crea un `<canvas>` off-screen y pregunta por `webgl2 || webgl`. `hasGPU = !!gl`.
3. **Memoria GPU**: lee `UNMASKED_RENDERER_WEBGL` y la parsea con `estimateGPUMemory(renderer)` (regex `/(\d+)\s*(?:GB|MB)/i`, convertido a MB).
4. **Tier**:
   - `isMobile` → `low`.
   - `gpuMemory > 2000` MB → `high`.
   - `isMobile` o `gpuMemory < 512` MB → `low`.
   - resto → `medium`.

> El canvas temporal se elimina tras la prueba para no contaminar el DOM.

---

## ⚙️ Configuración adaptativa por tier

Función `getOptimizedConfig(profile)` en `src/utils/performance.ts:70`. El consumidor es `components/devices3d/viewer/` (post-FX adapter).

| Tier   | pixelRatio       | SSAO | Bloom | DoF | Shadow Map | Texturas | Post-FX Passes |
| ------ | ---------------- | :--: | :---: | :-: | ---------- | -------- | -------------- |
| low    | `1`              |  ❌  |  ❌   |  ❌  | 512px      | low      | desactivados   |
| medium | `min(devicePixelRatio, 2)` | ✅ | ✅  |  ❌  | 1024px     | medium   | reducidos      |
| high   | `devicePixelRatio`| ✅  |  ✅   |  ✅  | 2048px     | high     | full           |

Para `medium` se aplican sombras activas; para `high` se monta el pipeline completo con DoF y multisampling.

---

## 🎬 Pipeline de render

### Post-Processing (`viewer/ViewerPostFX.tsx`)

Aplicación condicional de los efectos según `getOptimizedConfig`:

- **SSAO**: saltado en `low`, presente en `medium`/`high`.
- **Bloom**: presente en `medium`/`high`, intensidad reducida en `medium`.
- **DoF**: solo en `high`.
- **Multisampling (MSAA)**: 4× en `high`, 2× en `medium`, 0 en `low`.
- **Film Grain / Tone Mapping**: desactivados en `low`.

### Sombras (`setupOptimizedShadows`)

- Solo se trabaja sobre `DirectionalLight` y `PointLight`.
- Tamaño del `shadowMap` viene del tier (512 / 1024 / 2048).
- `near/far` fijados a `0.1 / 100`, frustum ortográfico de ±10 unidades (DirectionalLight).

### Culling

`enableFrustumCulling(scene)` recorre la escena y setea `frustumCulled = true` en cada `Mesh`. Esto es especialmente útil para escenas con varios modelos a la vez.

### Pixel Ratio

Bajamos `maxPixelRatio` capando según el tier. En `low` se fuerza a `1`; en `high` se respeta el `devicePixelRatio` nativo (generalmente `2` en Retina).

---

## 🧵 Texturas

Función `optimizeTexture(texture, resolution)`:

- Usa `THREE.LinearFilter` para `minFilter` y `magFilter`.
- En `low` se mantiene el filtro lineal básico.
- El conversor `useScreenTexture` (`components/devices3d/useScreenTexture.ts`) reduce tamaño de textura y maneja la conversión a `blob:` URL para evitar *CORS* con `thum.io`.

---

## 📈 Monitoreo en runtime

Clase `PerformanceMonitor` (`src/utils/performance.ts:126`) para diagnóstico:

| Método            | Qué retorna                                                 |
| ----------------- | ----------------------------------------------------------- |
| `update()`        | Llamar cada frame; muestrea deltas en una ventana de 60.   |
| `getFPS()`        | FPS instantáneo (calculado cada ≥1000 ms).                  |
| `getFrameTime()`  | Promedio de frame time (ms) en la ventana de muestreo.      |
| `getAverageFPS()` | `1000 / frameTime` redondeado.                             |

Útil para:

- Overlay de FPS en *dev*.
- Disparar качество re-adaptation en caliente (futuro).

---

## 🧹 Disposal y fugas de memoria

`disposeResources(obj)` libera geometrías, materiales y texturas:

- `Object3D` → recorre meshes y dispone `geometry` + `material` (soporta arrays de materiales).
- `Material` / `Texture` / `BufferGeometry` → llama a `dispose()` directamente.

Se usa en `useScreenTexture` para evitar fuga de *blob URLs* y geometrías al re-cargar capturas.

---

## 🛟 Fallbacks

- **`WebGLFallback`**: si `hasGPU === false` (o el contexto se pierde), se renderiza UI estática con instrucciones de “navegador no compatible”.
- **Captura CORS**: `useScreenTexture` convierte imágenes de `thum.io` a `blob:` URL antes de pasarlas al material, evitando *cross-origin* y *tainted canvas*.
- **Pixel ratio seguro**: capear `maxPixelRatio` previene cuelgues en pantallas 3× o multi-monitor.

---

## ✅ Cómo agregar una nueva optimización

1. Si es un parámetro nuevo, añádelo a `PerformanceConfig` y a la rama correspondiente en `getOptimizedConfig`.
2. En el pipeline consumidor (`viewer/` o el componente que aplique), lee el campo de `config.profile.tier` antes de activar el efecto.
3. Si la optimización tiene recursos que deben liberarse, expón un wrapper que llame a `disposeResources` en el `useEffect` cleanup.
4. Suma un test en `src/utils/__tests__/` para regresiones (umbral de tier, formato de salida, etc.).

---

## 🧪 Pruebas relacionadas

En `src/utils/__tests__/` y `src/data/__tests__/panelConstants.integrity.test.ts` se cubren los contratos del módulo. La performance real requiere Playwright en device farm (futuro).
