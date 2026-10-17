# Brief de diseño — Red FaCyT (Estrategia Rediseñada: Bienvenida Mobile-First & Slider)
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

## 1. Concepto e Identidad

**Gaceta digital universitaria con enfoque Mobile-First y presentación mediante Carrusel/Deslizante Interactivo (Slider).**
La plataforma institucional de la Facultad Experimental de Ciencias y Tecnología (FaCyT) presenta sus características clave mediante una experiencia ágil, envolvente y de rápida comprensión desde dispositivos móviles y de escritorio.

Tres principios rectores de esta nueva estrategia:
1. **Mobile-First & Responsividad Total** — Diseñado primariamente para pantallas de teléfonos inteligentes (control táctil/swipe) y adaptado fluidamente a computadoras de escritorio.
2. **Estrategia de Color Equilibrada (Charcoal/Obsidian Dark Base)**: Eliminación del fondo totalmente azul. Se utiliza un fondo neutro oscuro profundo (grafito/obsidiana) para que los colores institucionales (azul FaCyT) y de contraste (ámbar/acento tecnológico) destaquen como superficies y llamadas a la acción sin saturar la vista.
3. **Presentación Narrativa en Deslizante (Slider)**: En lugar de desplazamientos verticales complejos, la bienvenida presenta 3 a 4 diapositivas concisas que explican qué es la red, sus pilares (noticias, defensas, eventos) y guía al registro/login.

## 2. Audiencia y Tono

- **Audiencia:** Estudiantes, profesores, investigadores y personal administrativo de la facultad.
- **Tono:** Académico, limpio, dinámico, accesible e instructivo.
- **Idioma de la UI:** Español. El código y los identificadores permanecen en inglés.

## 3. Sistema de Color Rediseñado (Manejo de Color de Alto Contraste)

Para evitar una interfaz excesivamente azul, el fondo base pasa a ser un **gris oscuro neutro (Obsidian/Charcoal)** en modo oscuro o un gris editorial suave en modo claro. El azul institucional actúa como marca/tarjeta y el ámbar/cian como acento secundario de acción.

| Token | Light | Dark | Uso |
| --- | --- | --- | --- |
| `--bg` | `#F8FAFC` | `#0B0F19` | Fondo base (gris neutro/obsidiana, NUNCA azul puro) |
| `--surface` | `#FFFFFF` | `#141C2E` | Tarjetas del deslizante, contenedores de diálogo |
| `--surface-muted` | `#F1F5F9` | `#1E293B` | Fondo secundario de diapositivas y pill de navegación |
| `--text` | `#0F172A` | `#F1F5F9` | Texto principal (máxima legibilidad) |
| `--text-muted` | `#475569` | `#94A3B8` | Subtítulos, captions, indicadores inactivos |
| `--primary` | `#1E3E66` | `#3B82F6` | Azul institucional FaCyT (encabezados, insignias) |
| `--accent` | `#D97706` | `#F59E0B` | **Acento Secundario (Ámbar Académico)**: CTAs principales, estado activo del slider |
| `--accent-teal` | `#0284C7` | `#38BDF8` | **Acento Tecnológico (Cian)**: Enlaces, resaltados de características |
| `--border` | `#E2E8F0` | `#23324D` | Bordes finos de tarjetas y separadores |
| `--danger` | `#DC2626` | `#EF4444` | Errores o alertas |
| `--success` | `#16A34A` | `#22C55E` | Confirmaciones y estados |

## 4. Tipografía

- **Titulares (Display & H1):** Serif Editorial (ej. Georgia/Playfair/Merriweather) para el carácter universitario y de gaceta.
- **Cuerpo y Controles de UI:** Sans-serif moderno y legible (ej. Inter, system-ui) con excelente legibilidad en pantallas pequeñas.
- **Escala Responsiva:**
  - Móvil: H1 `1.75rem` (28px), Subtítulo `1rem` (16px).
  - Escritorio: H1 `2.5rem` (40px), Subtítulo `1.125rem` (18px).

## 5. Layout Mobile-First & Responsividad

- **Formato Móvil (Base):**
  - Deslizante a pantalla completa o contenedor card de alto impacto (`min-h-[75vh]`).
  - Soporte de gestos táctiles (Swipe izquierda/derecha con `touch-action: pan-y`).
  - Indicadores de diapositiva estilo "dots/pills" con tamaño mínimo de toque (44px target).
- **Formato Escritorio (Adaptación):**
  - Contenedor centrado con ancho máximo (`max-w-4xl` ~900px).
  - Botones de navegación laterales (flechas Anterior / Siguiente).
  - Distribución de 2 columnas dentro de la card: texto a la izquierda, ilustración a la derecha.

## 6. Movimiento y Animación en Slider

- Transiciones horizontales suaves (`transform: translateX(...)` con `cubic-bezier(0.16, 1, 0.3, 1)` de 350ms).
- Respeto estricto a `prefers-reduced-motion: reduce` (reemplaza deslizamiento por fundido instantáneo).