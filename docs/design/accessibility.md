# Accesibilidad y Usabilidad — Red FaCyT (Especificación Slider)
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

Directrices estricta de accesibilidad basadas en las guías **WCAG 2.2 Nivel AA** aplicadas a la nueva pantalla de bienvenida en formato **deslizante (slider/carrusel)**.

---

## 1. Cumplimiento de Contraste WCAG 2.2 AA

Con la nueva estrategia de color neutro oscuro (`--bg: #0B0F19`), los valores de contraste superan holgadamente el mínimo requerido de `4.5:1` para texto normal y `3.0:1` para elementos de interfaz.

| Elemento | Texto / Elemento | Fondo | Ratio de Contraste | Cumplimiento |
| --- | --- | --- | --- | --- |
| **Texto Principal** | `#F1F5F9` (Blanco suave) | `#0B0F19` (Obsidiana) | **16.2 : 1** | AAA ✅ |
| **Texto Muted** | `#94A3B8` (Gris claro) | `#0B0F19` (Obsidiana) | **6.5 : 1** | AA ✅ |
| **Botón Primario CTA** | `#0B0F19` (Texto Oscuro) | `#F59E0B` (Ámbar Acento) | **10.1 : 1** | AAA ✅ |
| **Bordes de Tarjeta** | `#23324D` (Borde sutil) | `#0B0F19` (Obsidiana) | **1.8 : 1** (decorativo) | N/A |

---

## 2. Patrón de Accesibilidad para Slider / Carrusel (ARIA)

El componente `LandingSlider` debe cumplir con el patrón oficial **WAI-ARIA Carousel Design Pattern**:

1. **Atributos del Contenedor Principal:**
   - `role="region"`
   - `aria-roledescription="carrusel"`
   - `aria-label="Presentación de características de Red FaCyT"`

2. **Atributos de cada Diapositiva (`SlideCard`):**
   - `role="group"`
   - `aria-roledescription="diapositiva"`
   - `aria-label="Diapositiva {index} de {total}: {title}"`
   - Las diapositivas inactivas llevan `aria-hidden="true"` e `tabindex="-1"` en sus elementos interactivos para evitar que el lector de pantalla navegue por contenido invisible.

3. **Anuncio de Cambios (`aria-live`):**
   - Se incluye una región `aria-live="polite"` e `aria-atomic="true"` que anuncia discretamente a los lectores de pantalla al cambiar de diapositiva (ej: *"Diapositiva 2 de 4: Avisos y Comunicados"*).

---

## 3. Zonas Táctiles Mínimas (Touch Targets ≥44px)

En dispositivos móviles:
- **Indicadores de Diapositiva (Pills/Dots):** El botón invisible envolvente mide `44px x 44px` aunque la pastilla visual mida `8px x 8px` u `32px x 8px`.
- **Botones CTA ("Empezar", "Ya tengo cuenta", "Omitir"):** Altura mínima de `48px` con `padding` adecuado para evitar toques accidentales.
- **Flechas de Navegación (Escritorio):** Mínimo `44px x 44px`.

---

## 4. Navegación por Teclado

1. **Foco Visible:** Todos los elementos interactivos cuentan con un anillo de enfoque de alto contraste (`focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2`).
2. **Atajos de Teclado:**
   - `Flecha Izquierda` (←): Regresa a la diapositiva anterior.
   - `Flecha Derecha` (→): Avanza a la siguiente diapositiva.
   - `Tab`: Navega secuencialmente entre el botón "Omitir", los controles del slider y los botones CTA principales.

---

## 5. Respeto a Movimiento Reducido (`prefers-reduced-motion`)

- Si el usuario tiene activada la preferencia de sistema `prefers-reduced-motion: reduce`:
  - Se desactivan por completo las transiciones de deslizamiento horizontal (`transform`).
  - El cambio entre diapositivas ocurre mediante una transición directa sin desplazamiento.
  - El avance automático (autoplay), si existiera, se deshabilita automáticamente.