/**
 * Normaliza cualquier fecha al formato YYYY-MM-DD (para comparaciones/filtros).
 * Soporta: DD/MM/YYYY, YYYY-MM-DD, ISO datetime, serial numérico de Excel.
 */
export function normDate(f) {
  if (!f && f !== 0) return "";
  // Serial numérico de Excel
  const num = Number(f);
  if (!isNaN(num) && num > 1000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  const s = String(f).trim();
  // ISO datetime con T (ej: 2024-03-15T00:00:00.000Z) — usar fecha LOCAL para evitar desfase de zona horaria
  if (s.includes('T')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    return s.slice(0, 10);
  }
  // Fecha con espacio (ej: 2024-03-15 00:00:00)
  if (s.match(/^\d{4}-\d{2}-\d{2} /)) return s.slice(0, 10);
  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // YYYY/MM/DD o YYYY-MM-DD
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