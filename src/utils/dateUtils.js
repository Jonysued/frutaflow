/**
 * Normaliza cualquier fecha al formato YYYY-MM-DD (para comparaciones/filtros).
 */
export function normDate(f) {
  if (!f) return "";
  const s = String(f).trim();
  const dmy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const ymd = s.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`;
  return s;
}

/**
 * Formatea una fecha YYYY-MM-DD para mostrar como DD/MM/AAAA.
 */
export function formatDate(d) {
  if (!d) return "";
  const parts = String(d).trim().split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}