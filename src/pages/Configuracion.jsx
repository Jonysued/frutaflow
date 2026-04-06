import { useState } from "react";
import { Settings, Box, Layers, Users, Send, Truck, MapPin, User, Tag, Leaf, Combine, Cog, Navigation, Ruler, LayoutList, LogOut, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
  { id: "calibres", label: "Calibres", icon: Ruler },
  { id: "categorias", label: "Categorías", icon: LayoutList },
  { id: "taras", label: "Tara de BINs", icon: Box },
  { id: "envases", label: "Tipos de Envases", icon: Settings },
  { id: "palets", label: "Tipos de Palet", icon: Truck },
  { id: "bultos", label: "Bultos por Palet", icon: Layers },
  { id: "usuarios", label: "Usuarios y Roles", icon: Users },
  { id: "informes", label: "Enviar Informes", icon: Send },
  { id: "cuenta", label: "Cuenta", icon: LogOut },
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
        {tab === "calibres" && (
          <ConfigListaSimple entityName="Calibre" title="Calibres" subtitle="Calibres disponibles para seleccionar en la hoja de producción." placeholder="Ej: 12, 14, 16" />
        )}
        {tab === "categorias" && (
          <ConfigListaSimple entityName="Categoria" title="Categorías" subtitle="Categorías de producto disponibles en la hoja de producción." placeholder="Ej: Cat 1, Cat 2" />
        )}
        {tab === "taras" && <ConfigTaras />}
        {tab === "envases" && <ConfigEnvases />}
        {tab === "palets" && <ConfigPalets />}
        {tab === "bultos" && <ConfigBultosPaletSection />}
        {tab === "usuarios" && <ConfigUsuarios />}
        {tab === "informes" && <ConfigInformes />}
        {tab === "cuenta" && <CuentaSection />}
      </div>
    </div>
  );
}

function CuentaSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "ELIMINAR") return;
    setDeleting(true);
    // Delete all user data then logout
    const [cosechas, producciones] = await Promise.all([
      base44.entities.Cosecha.list("-fecha", 99999),
      base44.entities.Produccion.list("-fecha", 99999),
    ]);
    await Promise.all([
      ...cosechas.map(c => base44.entities.Cosecha.delete(c.id)),
      ...producciones.map(p => base44.entities.Produccion.delete(p.id)),
    ]);
    setDeleting(false);
    base44.auth.logout();
  };

  return (
    <div className="space-y-6 max-w-sm">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Cuenta</h3>
        <p className="text-xs text-gray-500 mt-0.5">Gestioná tu sesión en la aplicación.</p>
      </div>
      <button
        onClick={() => base44.auth.logout()}
        className="flex items-center gap-2 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-sm font-semibold hover:bg-[#a93226]"
      >
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-800 text-sm mb-1">Zona peligrosa</h3>
        <p className="text-xs text-gray-500 mb-3">Esta acción eliminará permanentemente todos los datos de Cosecha y Producción, <strong>tu cuenta de usuario</strong>, y cerrará tu sesión.</p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" /> Eliminar todos mis datos
        </button>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Eliminar todos los datos</h3>
                <p className="text-xs text-gray-500 mt-1">Esta acción es irreversible. Se eliminarán todos los datos de cosecha, producción y <strong>tu cuenta de usuario</strong>. Para confirmar, escribí <strong>ELIMINAR</strong> en el campo de abajo.</p>
              </div>
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Escribí ELIMINAR"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowDeleteDialog(false); setConfirmText(""); }}
                className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "ELIMINAR" || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : "Confirmar y eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}