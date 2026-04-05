import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ProduccionForm from "@/components/ProduccionForm";
import { ArrowLeft } from "lucide-react";

export default function ProduccionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      base44.entities.Produccion.filter({ id }).then(res => {
        setItem(res[0] || null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/produccion")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#c0392b]">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-xl font-bold text-[#5c1020]">{id ? "Editar registro" : "Nuevo registro"}</h1>
      </div>
      <ProduccionForm
        item={item}
        onSave={() => navigate("/produccion")}
        onCancel={() => navigate("/produccion")}
      />
    </div>
  );
}