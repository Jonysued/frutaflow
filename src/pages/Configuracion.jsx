import { useState } from "react";
import { Settings, Box, Layers, Users, Send } from "lucide-react";
import ConfigTaras from "@/components/config/ConfigTaras";
import ConfigEnvases from "@/components/config/ConfigEnvases";
import ConfigBultosPaletSection from "@/components/config/ConfigBultosPalet";
import ConfigUsuarios from "@/components/config/ConfigUsuarios";
import ConfigInformes from "@/components/config/ConfigInformes";

const TABS = [
  { id: "taras", label: "Tara de BINs", icon: Box },
  { id: "envases", label: "Tipos de Envases", icon: Settings },
  { id: "palets", label: "Bultos por Palet", icon: Layers },
  { id: "usuarios", label: "Usuarios y Roles", icon: Users },
  { id: "informes", label: "Enviar Informes", icon: Send },
];

export default function Configuracion() {
  const [tab, setTab] = useState("taras");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#5c1020]">Configuración</h1>
        <p className="text-sm text-gray-500">Parámetros del sistema, taras, envases y usuarios</p>
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
        {tab === "taras" && <ConfigTaras />}
        {tab === "envases" && <ConfigEnvases />}
        {tab === "palets" && <ConfigBultosPaletSection />}
        {tab === "usuarios" && <ConfigUsuarios />}
        {tab === "informes" && <ConfigInformes />}
      </div>
    </div>
  );
}