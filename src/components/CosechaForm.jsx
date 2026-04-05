import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import MobileSelect from "@/components/MobileSelect";

function F({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const TURNOS = ["Mañana", "Tarde", "Noche"];

export default function CosechaForm({ item, onSave, onCancel }) {
  const [configTaras, setConfigTaras] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [todasProcedencias, setTodasProcedencias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [destinos, setDestinos] = useState([]);

  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    nro_bin: item?.nro_bin || "",
    especie: item?.especie || "GRANADAS",
    propietario: item?.propietario || "",
    tipo_cosecha: item?.tipo_cosecha || "",
    cuadrilla: item?.cuadrilla || "",
    procedencia: item?.procedencia || "",
    variedad: item?.variedad || "",
    bruto: item?.bruto || "",
    tara: item?.tara || "",
    neto: item?.neto || "",
    destino: item?.destino || "VUELCO",
    tipo_proceso: item?.tipo_proceso || "",
    fecha_vuelco: item?.fecha_vuelco || "",
    kgs_vuelco: item?.kgs_vuelco || "",
    stock_camara: item?.stock_camara || "",
    tipo_bin: item?.tipo_bin || "",
  });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => item?.id
      ? base44.entities.Cosecha.update(item.id, data)
      : base44.entities.Cosecha.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['cosechas'] });
      const previous = queryClient.getQueryData(['cosechas']);
      queryClient.setQueryData(['cosechas'], (old = []) =>
        item?.id
          ? old.map(c => c.id === item.id ? { ...c, ...newData } : c)
          : [{ ...newData, id: 'temp-' + Date.now() }, ...old]
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['cosechas'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cosechas'] }),
    onSuccess: () => onSave(),
  });

  useEffect(() => {
    Promise.all([
      base44.entities.ConfigTara.list(),
      base44.entities.Propietario.list(),
      base44.entities.Procedencia.list(),
      base44.entities.Variedad.list(),
      base44.entities.TipoCosecha.list(),
      base44.entities.Cuadrilla.list(),
      base44.entities.TipoProceso.list(),
      base44.entities.Destino.list(),
    ]).then(([taras, props, procs, vars, tcos, cuads, tproc, dests]) => {
      setConfigTaras(taras);
      setPropietarios(props);
      setTodasProcedencias(procs);
      setVariedades(vars);
      setTiposCosecha(tcos);
      setCuadrillas(cuads);
      setTiposProceso(tproc);
      setDestinos(dests);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const procedenciasFiltradas = form.propietario
    ? todasProcedencias.filter(p => p.propietario === form.propietario)
    : todasProcedencias;

  const handlePropietario = (propietario) => {
    setForm(f => {
      const procs = todasProcedencias.filter(p => p.propietario === propietario);
      const procedencia = procs.some(p => p.nombre === f.procedencia) ? f.procedencia : "";
      return { ...f, propietario, procedencia };
    });
  };

  const handleTipoBin = (tipo_bin) => {
    const config = configTaras.find(c => c.tipo_bin === tipo_bin);
    const tara = config ? config.tara_kg : "";
    setForm(f => {
      const neto = f.bruto !== "" && tara !== "" ? Number(f.bruto) - Number(tara) : f.neto;
      return { ...f, tipo_bin, tara, neto };
    });
  };

  const brutoTimer = useRef(null);
  const handleBruto = (bruto) => {
    setForm(f => ({ ...f, bruto }));
    if (brutoTimer.current) clearTimeout(brutoTimer.current);
    brutoTimer.current = setTimeout(() => {
      setForm(f => {
        const neto = bruto !== "" && f.tara !== "" ? Number(bruto) - Number(f.tara) : f.neto;
        return { ...f, neto };
      });
    }, 4000);
  };

  const handleTara = (tara) => {
    setForm(f => {
      const neto = f.bruto !== "" && tara !== "" ? Number(f.bruto) - Number(tara) : f.neto;
      return { ...f, tara, neto };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      bruto: Number(form.bruto),
      tara: Number(form.tara),
      neto: Number(form.neto),
      kgs_vuelco: form.kgs_vuelco !== "" ? Number(form.kgs_vuelco) : null,
      stock_camara: form.stock_camara !== "" ? Number(form.stock_camara) : null,
    };
    mutation.mutate(data);
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#f8d7da] p-4">
      <h2 className="font-semibold text-[#5c1020] mb-4 text-sm">{item ? "Editar BIN" : "Registrar BIN de cosecha"}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

        <F label="Fecha *"><input type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)} className={inputCls} /></F>

        <F label="Turno">
          <MobileSelect
            label="Turno"
            value={form.turno}
            onChange={v => set("turno", v || "Mañana")}
            options={TURNOS.map(t => ({ value: t, label: t }))}
          />
        </F>

        <F label="Nro de BIN *"><input type="text" required value={form.nro_bin} onChange={e => set("nro_bin", e.target.value)} className={inputCls} /></F>
        <F label="Especie *"><input required value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} /></F>

        <F label="Propietario">
          <MobileSelect
            label="Propietario"
            value={form.propietario}
            onChange={handlePropietario}
            options={propietarios.map(p => ({ value: p.nombre, label: p.nombre }))}
          />
        </F>

        <F label="Procedencia">
          <MobileSelect
            label="Procedencia"
            value={form.procedencia}
            onChange={v => set("procedencia", v)}
            options={procedenciasFiltradas.map(p => ({ value: p.nombre, label: p.nombre }))}
          />
        </F>

        <F label="Variedad *">
          <MobileSelect
            label="Variedad"
            value={form.variedad}
            onChange={v => set("variedad", v)}
            options={variedades.map(v => ({ value: v.nombre, label: v.nombre }))}
          />
        </F>

        <F label="Tipo de Cosecha">
          <MobileSelect
            label="Tipo de Cosecha"
            value={form.tipo_cosecha}
            onChange={v => set("tipo_cosecha", v)}
            options={tiposCosecha.map(t => ({ value: t.nombre, label: t.nombre }))}
          />
        </F>

        <F label="Cuadrilla">
          <MobileSelect
            label="Cuadrilla"
            value={form.cuadrilla}
            onChange={v => set("cuadrilla", v)}
            options={cuadrillas.map(c => ({ value: c.nombre, label: c.nombre }))}
          />
        </F>

        <F label="Tipo de BIN (tara auto)">
          <MobileSelect
            label="Tipo de BIN"
            value={form.tipo_bin}
            onChange={handleTipoBin}
            options={configTaras.map(c => ({ value: c.tipo_bin, label: `${c.tipo_bin} — ${c.tara_kg} kg` }))}
          />
        </F>

        <F label="Bruto (kg) *">
          <input type="number" required min="0" value={form.bruto} onChange={e => handleBruto(e.target.value)} className={inputCls} />
        </F>
        <F label="Tara BIN (kg)">
          <input type="number" min="0" value={form.tara} onChange={e => handleTara(e.target.value)} className={`${inputCls} bg-gray-50`} />
        </F>
        <F label="Neto (kg) = Bruto − Tara">
          <input type="number" required value={form.neto} onChange={e => set("neto", e.target.value)} className={`${inputCls} bg-gray-50 font-semibold`} />
        </F>

        <F label="Destino">
          <MobileSelect
            label="Destino"
            value={form.destino}
            onChange={v => set("destino", v)}
            options={destinos.map(d => ({ value: d.nombre, label: d.nombre }))}
          />
        </F>

        <F label="Tipo de proceso">
          <MobileSelect
            label="Tipo de proceso"
            value={form.tipo_proceso}
            onChange={v => set("tipo_proceso", v)}
            options={tiposProceso.map(t => ({ value: t.nombre, label: t.nombre }))}
          />
        </F>

        <F label="Fecha Vuelco"><input type="date" value={form.fecha_vuelco} onChange={e => set("fecha_vuelco", e.target.value)} className={inputCls} /></F>
        <F label="Kgs Vuelco"><input type="number" value={form.kgs_vuelco} onChange={e => set("kgs_vuelco", e.target.value)} className={inputCls} /></F>
        <F label="Stock en Cámara (kg)"><input type="number" value={form.stock_camara} onChange={e => set("stock_camara", e.target.value)} className={inputCls} /></F>

        <div className="col-span-2 sm:col-span-3 md:col-span-4 flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60">
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}