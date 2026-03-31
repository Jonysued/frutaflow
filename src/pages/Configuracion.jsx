import { useState } from "react";
import { Settings, Box, Layers, Users, Send, Truck, MapPin, User, Tag, Leaf, Combine, Cog, Navigation } from "lucide-react";
import ConfigTaras from "@/components/config/ConfigTaras";
import ConfigEnvases from "@/components/config/ConfigEnvases";
import ConfigBultosPaletSection from "@/components/config/ConfigBultosPalet";
import ConfigPalets from "@/components/config/ConfigPalets";
import ConfigUsuarios from "@/components/config/ConfigUsuarios";
import ConfigInformes from "@/components/config/ConfigInformes";
import ConfigProcedencias from "@/components/config/ConfigProcedencias";
import ConfigListaSimple from "@/components/config/ConfigListaSimple";

const TABS = [
  { id: "propietarios", label: "Propietarios", icon: User },
  { id: "procedencias", label: "Procedencias", icon: MapPin },
  { id: "variedades", label: "Variedades", icon: Leaf },
  { id: "tipo_cosecha", label: "Tipos de Cosecha", icon: Tag },
  { id: "cuadrillas", label: "Cuadrillas", icon: Combine },
  { id: "tipo_proceso", label: "Tipos de Proceso", icon: Cog },
  { id: "destinos", label: "Destinos", icon: Navigation },
  { id: "taras", label: "Tara de BINs", icon: Box },
  { id: "envases", label: "Tipos de Envases", icon: Settings },
  { id: "palets", label: "Tipos de Palet", icon: Truck },
  { id: "bultos", label: "Bultos por Palet", icon: Layers },
  { id: "usuarios", label: "Usuarios y Roles", icon: Users },
  { id: "informes", label: "Enviar Informes", icon: Send },
];

export default function Configuracion() {
  const [tab, setTab] = useState("propietarios");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#5c1020]">Configuración</h1>
        <p className="text-sm text-gray-500">Parámetros del sistema, listas desplegables, taras y usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
              tab === id
                ? "border-[#c0392b] text-[#c0392b] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {tab === "propietarios" && (
          <ConfigListaSimple entityName="Propietario" title="Propietarios" subtitle="Propietarios disponibles para seleccionar en la hoja de cosecha." placeholder="Ej: Las 500, Glonet" />
        )}
        {tab === "procedencias" && <ConfigProcedencias />}
        {tab === "variedades" && (
          <ConfigListaSimple entityName="Variedad" title="Variedades" subtitle="Variedades de fruta disponibles en la hoja de cosecha." placeholder="Ej: Wonderful, Acco" />
        )}
        {tab === "tipo_cosecha" && (
          <ConfigListaSimple entityName="TipoCosecha" title="Tipos de Cosecha" subtitle="Tipos de cosecha disponibles (Barrido, Selectiva, etc.)." placeholder="Ej: BARRIDO" />
        )}
        {tab === "cuadrillas" && (
          <ConfigListaSimple entityName="Cuadrilla" title="Cuadrillas" subtitle="Cuadrillas disponibles para asignar en la hoja de cosecha." placeholder="Ej: GARCIA" />
        )}
        {tab === "tipo_proceso" && (
          <ConfigListaSimple entityName="TipoProceso" title="Tipos de Proceso" subtitle="Tipos de proceso disponibles (Arilo, Jugo, Fresco, etc.)." placeholder="Ej: ARILO" />
        )}
        {tab === "destinos" && (
          <ConfigListaSimple entityName="Destino" title="Destinos" subtitle="Destinos disponibles para seleccionar al registrar un BIN de cosecha." placeholder="Ej: VUELCO, CAMARA" />
        )}
        {tab === "taras" && <ConfigTaras />}
        {tab === "envases" && <ConfigEnvases />}
        {tab === "palets" && <ConfigPalets />}
        {tab === "bultos" && <ConfigBultosPaletSection />}
        {tab === "usuarios" && <ConfigUsuarios />}
        {tab === "informes" && <ConfigInformes />}
      </div>
    </div>
  );
}