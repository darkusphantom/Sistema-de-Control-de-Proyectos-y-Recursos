# Wireframes — Bienvenida `/` (Red FaCyT)
> **Pivot 2026-10-17**: esta pantalla fue **eliminada** con el dominio anterior (commit `9989b02`); el documento se conserva como referencia histórica. El nuevo dominio tendrá sus propios wireframes (Fase 2, `docs/pivot-project.md` §5).

Esquemas de la pantalla pública de introducción, organizada en torno a un
**deslizante (slider/carrusel) interactivo y responsivo**.

Especificación detallada en [`welcome.md`](welcome.md). El mapa de navegación
general y los esquemas de las demás pantallas están en
[`wireframes.md`](wireframes.md); los de autenticación, en
[`wireframes_auth.md`](wireframes_auth.md).

> [!IMPORTANT]
> **Layout independiente:** utiliza el layout de `(landing)`
> (`LandingHeader` + `LandingFooter`). **NO** renderiza la `Navbar`, `Sidebar`
> ni `BottomNav` del shell autenticado `(main)`.

## 1. Estado

**Implementado** (2026-09-25, commit `4c4eec5`) con `LandingSlider`,
`SlideCard`, `SlideIndicators`, `LandingHeader` y `LandingFooter`. Registro en
[`../architecture/progress.md`](../architecture/progress.md).

Estos esquemas **sustituyen** a los del wireframe parallax vertical anterior: el
scroll parallax fue reemplazado por el deslizante.

## 2. Mapa de navegación del flujo de bienvenida

```
                          ┌───────────────────────────┐
                          │    PÁGINA DE BIENVENIDA   │
                          │   / (landing/page.tsx)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  SLIDE 1: BIENVENIDA │ ──►│ SLIDE 2: COMUNICADOS │ ──►│ SLIDE 3: ACADÉMICO   │
│ Gaceta Digital FaCyT │ ◄──│  Noticias y Avisos   │ ◄──│  Defensas y Tesis    │
└──────────────────────┘    └──────────────────────┘    └──────────┬───────────┘
                                                                   │
                                                                   ▼
┌──────────────────────┐                                ┌──────────────────────┐
│       REGISTRO       │ ◄──────────────────────────────│   SLIDE 4: COMUNIDAD │
│      (/register)     │    Botón "Empezar" / CTA       │  Únete a la Red + CTA│
└──────────────────────┘                                └──────────┬───────────┘
                                                                   │
┌──────────────────────┐                                          │
│    INICIO SESIÓN     │ ◄────────────────────────────────────────┘
│       (/login)       │    Botón "Ya tengo cuenta" / "Omitir"
└──────────────────────┘
```

## 3. Wireframe móvil (360px–480px) — vista principal

```
┌───────────────────────────────────────────┐
│ [FaCyT Logo]                 [🌙] [Omitir] │  ← Header Superior Fijo
├───────────────────────────────────────────┤
│                                           │
│ ┌───────────────────────────────────────┐ │
│ │ SLIDE 1 / 4                           │ │  ← Contenedor Deslizante (Swipeable)
│ │                                       │ │
│ │  [ILUSTRACIÓN HERO]                   │ │
│ │                                       │ │
│ │  Gaceta Digital FaCyT                 │ │  ← Titular H1 Serif
│ │  Facultad Experimental de Ciencias    │ │
│ │  y Tecnología                         │ │
│ │                                       │ │
│ │  Tu espacio oficial para noticias,    │ │  ← Subtítulo descriptivo
│ │  eventos y publicaciones científicas. │ │
│ └───────────────────────────────────────┘ │
│                                           │
│           [ ●  ○  ○  ○ ]                  │  ← Indicadores de Diapositiva (Pills)
│                                           │
├───────────────────────────────────────────┤
│ [ Empezar (Registro) ]                    │  ← Botón Primario (Sticky)
│ [ Ya tengo cuenta (Login) ]               │  ← Enlace/Botón Secundario
└───────────────────────────────────────────┘
```

## 4. Wireframe escritorio (1024px+) — adaptación responsiva

En escritorio la vista se centra sobre el fondo base, mostrando una tarjeta
amplia de 2 columnas con navegación por flechas.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  [FaCyT Logo Gaceta]                             [🌙 Tema] [Omitir ↦]     │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│            ┌─────────────────────────────────────────────────┐            │
│            │ SLIDE ACTIVE (2 columnas)                       │            │
│            │                                                 │            │
│  [◄ Prev]  │  ┌────────────────────┬──────────────────────┐  │  [Next ►]  │
│            │  │ TEXTO E INFORMACIÓN│ ILUSTRACIÓN / ASSET  │  │            │
│            │  │                    │                      │  │            │
│            │  │ Red FaCyT          │  [ facyt_hero_       │  │            │
│            │  │ La gaceta digital  │    gazette.png ]     │  │            │
│            │  │ universitaria.     │                      │  │            │
│            │  │                    │                      │  │            │
│            │  │ [ Empezar ahora ]  │                      │  │            │
│            │  └────────────────────┴──────────────────────┘  │            │
│            └─────────────────────────────────────────────────┘            │
│                                                                           │
│                              [ ●  ○  ○  ○ ]                               │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│  © 2026 Facultad Experimental de Ciencias y Tecnología — Universidad      │
└───────────────────────────────────────────────────────────────────────────┘
```

## 5. Desglose de diapositivas

| Diapositiva               | Ilustración / Asset           | Titular                            | Descripción                                                                                                       | Acción destacada       |
| ------------------------- | ----------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Slide 1: Presentación** | `facyt_hero_gazette.png`      | **Red FaCyT: La Gaceta Digital**   | La plataforma oficial de comunicación, noticias y ciencia de la Facultad Experimental de Ciencias y Tecnología.   | Siguiente / Empezar    |
| **Slide 2: Noticias**     | `news_pillar_icon.png`        | **01. Avisos y Comunicados**       | Entérate al instante de comunicados decanales, noticias departamentales y boletines académicos.                    | Siguiente               |
| **Slide 3: Académico**    | `academic_pillar_icon.png`    | **02. Publicaciones y Defensas**   | Explora carteleras de trabajos de grado, publicaciones de investigación y seminarios de la facultad.              | Siguiente               |
| **Slide 4: Comunidad**    | `campus_pillar_icon.png`      | **03. Vida Universitaria**         | Participa activa e integradamente como estudiante, profesor o personal administrativo.                              | **[ Empezar Registro ]** |

## 6. Comportamientos interactivos

1. **Gestos táctiles (swipe en móvil):** deslizar a la izquierda avanza de
   diapositiva; a la derecha, vuelve a la anterior.
2. **Navegación por teclado:** `←` y `→` cambian la diapositiva activa.
3. **Indicadores (pills):** al pulsarlos se va directo a esa diapositiva; el
   punto activo se expande y toma el color de acento `--accent`.

Accesibilidad del patrón en [`accessibility.md`](accessibility.md) §2.
