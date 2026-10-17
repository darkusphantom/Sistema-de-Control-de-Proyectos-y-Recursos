# Especificación de Diseño: Pantalla de Bienvenida `/` — Red FaCyT (Estrategia Slider Mobile-First)
> **Pivot 2026-10-17**: esta pantalla fue **eliminada** con el dominio anterior (commit `9989b02`); el documento se conserva como referencia histórica. El nuevo dominio tendrá sus propios wireframes (Fase 2, `docs/pivot-project.md` §5).

**Documento de especificación accionable para el agente `developer`.** Define la arquitectura visual, la estrategia de color neutro oscuro, el componente de deslizante interactivo (slider), la experiencia de usuario mobile-first y el flujo de onboarding cliente.

---

## 1. Resumen Ejecutivo y Cambio de Estrategia

Atendiendo a las pruebas y retroalimentación de usabilidad:
- **Se descarta:** La versión anterior basada en scroll vertical complejo con múltiples capas parallax.
- **Nueva Estrategia:** Pantalla de bienvenida **ligera, rápida y 100% responsiva** centrada en un **Carrusel / Deslizante Interactivo (Slider)**.
- **Estrategia de Color:** Eliminación del fondo totalmente azul. Se establece un fondo base **gris oscuro neutro/obsidiana (`#0B0F19`)**, donde el azul institucional FaCyT (`#3B82F6` / `#1E3E66`) actúa en la marca y superficies de tarjetas, y un **acento secundario ámbar (`#F59E0B`)** destaca los botones de acción principales y el estado activo del carrusel.

---

## 2. Arquitectura de Componentes de la Pantalla `/`

La bienvenida habita en el grupo de rutas aislado `src/app/(landing)/` con su propio layout dedicado (`(landing)/layout.tsx`), independiente de la aplicación autenticada `(main)`.

```
src/
├── app/
│   └── (landing)/
│       ├── layout.tsx         # Layout aislado (sin Sidebar/BottomNav autenticado)
│       └── page.tsx           # Página cliente de bienvenida con LandingSlider
└── components/
    └── landing/
        ├── landing-header.tsx  # Header público (Logo FaCyT + ThemeToggle + Omitir)
        ├── landing-slider.tsx  # Componente cliente del deslizante/carrusel (Swipe + Keyboard + Touch)
        ├── slide-card.tsx      # Renderizador de cada tarjeta de diapositiva (Responsive 1col/2col)
        ├── slide-indicators.tsx# Pastillas indicadoras inferiores con hit-target de 44px
        └── landing-footer.tsx  # Pie de página público simplificado
```

---

## 3. Datos de las Diapositivas del Carrusel

El desarrollador implementará un array con la siguiente estructura de datos estática para alimentar el slider:

```typescript
export interface SlideData {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  accentColor?: string;
}

export const LANDING_SLIDES: SlideData[] = [
  {
    id: "welcome",
    badge: "GACETA DIGITAL OFICIAL",
    title: "Red FaCyT: La plataforma de nuestra facultad",
    subtitle: "El espacio institucional para comunicar noticias, publicar trabajos científicos, seguir defensas de grado y conectar con la comunidad de la Facultad Experimental de Ciencias y Tecnología.",
    imageSrc: "/images/landing/facyt_hero_gazette.png",
    imageAlt: "Ilustración de la gaceta digital FaCyT con elementos científicos y académicos.",
  },
  {
    id: "news",
    badge: "01. INFORMACIÓN AL INSTANTE",
    title: "Noticias, avisos y comunicados oficiales",
    subtitle: "Recibe de primera mano los comunicados decanales, avisos departamentales y boletines de prensa de la facultad sin perderte nada importante.",
    imageSrc: "/images/landing/news_pillar_icon.png",
    imageAlt: "Icono vectorial de noticias y boletines institucionales FaCyT.",
  },
  {
    id: "academic",
    badge: "02. EXCELENCIA CIENTÍFICA",
    title: "Cartelera académica y defensas de grado",
    subtitle: "Consulta el cronograma de seminarios, publicaciones de investigación y presentaciones de tesis de estudiantes y profesores.",
    imageSrc: "/images/landing/academic_pillar_icon.png",
    imageAlt: "Icono vectorial de publicaciones académicas y birrete de graduación.",
  },
  {
    id: "campus",
    badge: "03. COMUNIDAD UNIVERSITARIA",
    title: "Un espacio para todos los perfiles",
    subtitle: "Diseñado para la colaboración activa entre estudiantes, personal docente, investigadores y la administración de FaCyT.",
    imageSrc: "/images/landing/campus_pillar_icon.png",
    imageAlt: "Icono vectorial de la comunidad y campus universitario.",
  },
];
```

---

## 4. Flujo de Onboarding (`localStorage facy:onboarding`)

| Acción del Usuario | Estado `localStorage['facy:onboarding']` | Destino |
| --- | --- | --- |
| **Ingreso inicial a `/`** | `null` | Renderiza la landing con el `LandingSlider`. |
| **Visita recurrente a `/`** | `'visto'` | Redirección automática client-side a `/login`. |
| **Click en "Omitir" / "Iniciar sesión"** | Fija `'visto'` | Navega a `/login`. |
| **Click en "Empezar" (CTA final)** | Fija `'visto'` | Navega a `/register`. |

---

## 5. Requisitos de Estilo y Layout (Tailwind CSS)

1. **Fondo Base Neutral:** `bg-slate-950` (`#0B0F19`) en modo oscuro, `bg-slate-50` (`#F8FAFC`) en modo claro.
2. **Tarjeta de Diapositivas:** `bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm`.
3. **Botón Primario CTA:** `bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all`.
4. **Navegación Móvil (Swipe):** `touch-pan-y` en el contenedor `LandingSlider`.
5. **Navegación Escritorio (Flechas):** Ocultas en móvil (`hidden md:flex`), fijas a los costados de la tarjeta principal.

---

## 6. Checklist para la Implementación por el Agente `developer`

- [ ] Crear los componentes en `src/components/landing/` (`landing-header.tsx`, `landing-slider.tsx`, `slide-card.tsx`, `slide-indicators.tsx`, `landing-footer.tsx`).
- [ ] Actualizar `src/app/(landing)/page.tsx` para usar la nueva arquitectura basada en el carrusel/slider.
- [ ] Verificar soporte de gestos táctiles swipe y navegación con flechas de teclado (`←` y `→`).
- [ ] Validar guard de onboarding con `localStorage['facy:onboarding']`.
- [ ] Asegurar que no haya errores de linting (`pnpm lint`) y ejecutar suite de pruebas con Vitest.