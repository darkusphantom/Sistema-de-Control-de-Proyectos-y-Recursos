# Componentes y Tokens de Diseño — Red FaCyT (Especificación Slider)
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

Especificación de componentes de UI y tokens de diseño para la vista de bienvenida `/` (`(landing)`) basada en el **deslizante interactivo mobile-first**.

---

## 1. Tokens de Diseño (Estrategia de Color Neutro Oscuro)

### 1.1 Tokens de Color (Modo Claro vs. Modo Oscuro)

> [!IMPORTANT]
> **Cambio de Estrategia:** El fondo base (`--bg`) se establece en un gris oscuro neutro/obsidiana (`#0B0F19`) en modo oscuro y gris suave (`#F8FAFC`) en modo claro. El azul no cubre el fondo; se reserva para la marca, tarjetas y bordes.

| Token CSS | Modo Claro | Modo Oscuro | Propósito |
| --- | --- | --- | --- |
| `--bg` | `#F8FAFC` | `#0B0F19` | Fondo base de pantalla (Gris neutro/obsidiana) |
| `--surface` | `#FFFFFF` | `#141C2E` | Fondo de la tarjeta principal del slider |
| `--surface-muted` | `#F1F5F9` | `#1E293B` | Fondo de contenedores secundarios e insignias |
| `--text` | `#0F172A` | `#F1F5F9` | Texto de alta legibilidad |
| `--text-muted` | `#64748B` | `#94A3B8` | Texto secundario y subtítulos |
| `--primary` | `#1E3E66` | `#3B82F6` | Azul institucional FaCyT (Marca, bordes destacados) |
| `--accent` | `#D97706` | `#F59E0B` | **Acento Secundario (Ámbar)**: Botones CTA principales e indicador activo |
| `--accent-hover` | `#B45309` | `#D97706` | Hover/Active en botones CTA |
| `--border` | `#E2E8F0` | `#23324D` | Bordes sutiles en tarjetas y separadores |

---

## 2. Componentes Propuestos

### 2.1 `LandingSlider` (Contenedor Principal del Carrusel)

Componente cliente (`"use client"`) encargado de gestionar el estado de la diapositiva activa, los eventos táctiles (swipe) y el soporte de teclado.

```tsx
interface LandingSliderProps {
  slides: SlideItem[];
  autoPlayInterval?: number; // Desactivado por defecto si prefers-reduced-motion
}

interface SlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}
```

### 2.2 `SlideIndicators` (Puntos de Control / Navigation Pills)

Barra inferior con indicadores interactivos.
- **Tamaño de toque:** Mínimo `44px x 44px` por área interactiva para usabilidad táctil.
- **Estado Inactivo:** Círculo pequeño `8px x 8px` con color `--text-muted` y opacidad 0.4.
- **Estado Activo:** Pastilla expandida `32px x 8px` con animación suave y color de acento `--accent` (#F59E0B).

### 2.3 `SlideCard` (Tarjeta de Diapositiva)

Contenedor de la diapositiva en vista actual.
- **Móvil:** Layout en 1 columna, centrado verticalmente, optimizado para legibilidad.
- **Escritorio:** Grid de 2 columnas (`grid-cols-2`), texto a la izquierda, imagen vectorial a la derecha.

---

## 3. Guía de Interacción y Accesibilidad de Componentes

1. **Touch Swipe Target:** El área deslizante ocupa el 100% del ancho del viewport en móvil (`w-full overflow-hidden touch-pan-y`).
2. **Flechas de Navegación (Escritorio):**
   - Visibles a partir del breakpoint `md:` (768px+).
   - Botón circular con icono Chevron (`44px` de diámetro), fondo `--surface-muted` con hover `--primary`.
3. **Guard de Onboarding Integrado:**
   - Botón "Omitir" en la cabecera fija la marca `facy:onboarding = 'visto'` en `localStorage` y redirige inmediatamente a `/login`.
   - Botón "Empezar" fija `facy:onboarding = 'visto'` y navega a `/register`.