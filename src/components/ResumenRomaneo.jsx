import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";

const COLS = [
  { key: "rom", label: "N° Romaneo", align: "left" },
  { key: "productor", label: "Productor", align: "left" },
  { key: "variedad", label: "Variedad", align: "left" },
  { key: "cantRegistros", label: "Registros", align: "center" },
  { key: "totalBultos", label: "Bultos", align: "right" },
  { key: "totalKgNetos", label: "Kg Netos", align: "right" },
  { key: "totalKgBruto", label: "Kg Bruto", align: "right" },
  { key: "ultimaFecha", label: "Última fecha", align: "left" },
];

export default function ResumenRomaneo({ producciones }) {
  const [sortCol, setSortCol] = useState("rom");
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({});
  const [selectedRom, setSelectedRom] = useState(null);

  const romaneos = useMemo(() => {
    const unicos = [...new Set(producciones.map(p => p.nro_romaneo).filter(Boolean))].sort();
    return unicos.map(rom => {
      const registros = producciones.filter(p => p.nro_romaneo === rom);
      const ordenados = [...registros].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
      const ultimo = ordenados[0];
      return {
        rom,
        productor: ultimo?.productor || ultimo?.propietario || "—",
        variedad: ultimo?.variedad || "—",
        cantRegistros: registros.length,
        totalBultos: registros.reduce((s, p) => s + (p.cant_bultos || 0), 0),
        totalKgNetos: registros.reduce((s, p) => s + (p.kg_netos || 0), 0),
        totalKgBruto: registros.reduce((s, p) => s + (p.kg_bruto || 0), 0),
        ultimaFecha: ultimo?.fecha || "—",
        ultimoRegistro: ultimo,
        registros,
      };
    });
  }, [producciones]);

  const filtered = useMemo(() => {
    return romaneos.filter(r => {
      return Object.entries(filters).every(([k, v]) => {
        if (!v) return true;
        return String(r[k] ?? "").toLowerCase().includes(v.toLowerCase());
      });
    });
  }, [romaneos, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const selectedData = selectedRom ? romaneos.find(r => r.rom === selectedRom) : null;

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (romaneos.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[#5c1020] mb-1">Resumen de Producción por Romaneo</h2>
        <p className="text-xs text-gray-400">Palets terminados y totales acumulados. Hacé clic en una fila para ver el detalle.</p>
      </div>

      {/* Detalle del romaneo seleccionado */}
      {selectedData && (() => {
        // Agrupar todos los registros del romaneo seleccionado por letra
        const porLetra = {};
        selectedData.registros.forEach(p => {
          const nro = p.nro_romaneo || "";
          // Extraer letra(s) iniciales y número final
          const match = nro.match(/^([A-Za-z]+)(\d+)$/);
          const letra = match ? match[1].toUpperCase() : nro || "?";
          const num = match ? parseInt(match[2]) : 0;
          if (!porLetra[letra]) porLetra[letra] = { count: 0, maxNum: 0, ultimo: "" };
          porLetra[letra].count += 1;
          if (num > porLetra[letra].maxNum) {
            porLetra[letra].maxNum = num;
            porLetra[letra].ultimo = nro;
          }
        });

        return (
          <div className="bg-[#f4fbf7] border border-[#276749]/30 rounded-xl p-4 relative">
            <button onClick={() => setSelectedRom(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-[#276749] text-sm mb-3">Detalle — Romaneo {selectedData.rom}</h3>

            {/* Por letra */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Palets por letra</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(porLetra).sort(([a], [b]) => a.localeCompare(b)).map(([letra, info]) => (
                  <div key={letra} className="bg-white border border-[#276749]/20 rounded-xl px-4 py-3 min-w-[120px]">
                    <p className="text-2xl font-black text-[#276749]">{letra}</p>
                    <p className="text-xs text-gray-400 mt-1">Palets</p>
                    <p className="font-bold text-gray-800 text-lg">{info.count}</p>
                    <p className="text-xs text-gray-400 mt-1">Último N°</p>
                    <p className="font-semibold text-[#276749] font-mono">{info.ultimo}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Último registro */}
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Último registro cargado</p>
            {selectedData.ultimoRegistro ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                {[
                  ["Fecha", selectedData.ultimoRegistro.fecha],
                  ["Turno", selectedData.ultimoRegistro.turno],
                  ["Productor", selectedData.ultimoRegistro.productor || selectedData.ultimoRegistro.propietario],
                  ["Especie", selectedData.ultimoRegistro.especie],
                  ["Variedad", selectedData.ultimoRegistro.variedad],
                  ["Envase", selectedData.ultimoRegistro.envase],
                  ["Calibre", selectedData.ultimoRegistro.calibre],
                  ["Categoría", selectedData.ultimoRegistro.categoria],
                  ["Tipo Palet", selectedData.ultimoRegistro.tipo_palet],
                  ["Cant. Bultos", selectedData.ultimoRegistro.cant_bultos],
                  ["Kg Bruto", selectedData.ultimoRegistro.kg_bruto?.toLocaleString()],
                  ["Kg Netos", selectedData.ultimoRegistro.kg_netos?.toLocaleString()],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="bg-white rounded-lg px-3 py-2 border border-[#276749]/10">
                    <p className="text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-xs">Sin datos</p>}
          </div>
        );
      })()}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#276749] text-white text-xs">
              {COLS.map(col => (
                <th key={col.key} className={`px-3 py-2 text-${col.align} cursor-pointer select-none hover:bg-[#1e5038] whitespace-nowrap`} onClick={() => toggleSort(col.key)}>
                  <span className="flex items-center gap-1 justify-start">
                    {col.label} <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
            {/* Fila de filtros */}
            <tr className="bg-[#f0faf5] border-b border-[#276749]/20 text-xs">
              {COLS.map(col => (
                <td key={col.key} className="px-2 py-1.5">
                  <div className="relative">
                    <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                    <input
                      value={filters[col.key] || ""}
                      onChange={e => setFilter(col.key, e.target.value)}
                      placeholder="Filtrar..."
                      className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#276749] bg-white"
                    />
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.rom}
                onClick={() => setSelectedRom(r.rom === selectedRom ? null : r.rom)}
                className={`cursor-pointer transition-colors ${r.rom === selectedRom ? "bg-[#d5f0e1] border-l-4 border-[#276749]" : i % 2 === 0 ? "bg-white hover:bg-[#f4fbf7]" : "bg-[#f9fdfb] hover:bg-[#f4fbf7]"}`}
              >
                <td className="px-3 py-2.5 font-mono font-bold text-[#276749]">{r.rom}</td>
                <td className="px-3 py-2.5 text-gray-700">{r.productor}</td>
                <td className="px-3 py-2.5 text-gray-600">{r.variedad}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{r.cantRegistros}</span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-gray-800">{r.totalBultos.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{r.totalKgNetos.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{r.totalKgBruto.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-gray-500">{r.ultimaFecha}</td>
              </tr>
            ))}
            <tr className="bg-[#276749]/10 font-bold text-sm border-t-2 border-[#276749]">
              <td className="px-3 py-2.5 text-[#276749]" colSpan={4}>TOTAL ({sorted.length} romaneos)</td>
              <td className="px-3 py-2.5 text-right text-[#276749]">{sorted.reduce((s, r) => s + r.totalBultos, 0).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-[#276749]">{sorted.reduce((s, r) => s + r.totalKgNetos, 0).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-[#276749]">{sorted.reduce((s, r) => s + r.totalKgBruto, 0).toLocaleString()}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}