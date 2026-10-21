/**
 * Utilidad pura para actualizar el mapa de errores de un formulario.
 *
 * Existe para evitar re-renders innecesarios: React compara la referencia del
 * estado devuelto por un "updater" y omite el render si no cambió. Al devolver
 * el mismo objeto cuando el error no varía, los campos del formulario que no
 * cambiaron no se vuelven a renderizar.
 */

/** Mapa de errores por nombre de campo. */
export type FieldErrors = Record<string, string>;

/**
 * Aplica el resultado de la validación de un campo al mapa de errores.
 *
 * - `error !== null`: agrega o reemplaza la entrada del campo.
 * - `error === null`: elimina la entrada del campo si existe.
 *
 * En ambos casos devuelve **la misma referencia** de `prev` cuando la operación
 * no modificaría el mapa, para que React salte el re-render.
 *
 * @param prev Mapa de errores actual.
 * @param name Nombre del campo validado.
 * @param error Mensaje de error o `null` si el campo es válido.
 * @returns El mapa de errores resultante (misma referencia si no hay cambios).
 * @complexity O(n) en el número de claves del mapa (copia defensiva).
 */
export function applyFieldError(
  prev: FieldErrors,
  name: string,
  error: string | null,
): FieldErrors {
  if (error === null) {
    if (!(name in prev)) return prev;

    const next = { ...prev };
    delete next[name];
    return next;
  }

  if (prev[name] === error) return prev;

  return { ...prev, [name]: error };
}
