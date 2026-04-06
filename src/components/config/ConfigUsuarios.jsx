import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus } from "lucide-react";
import MobileSelect from "@/components/MobileSelect";

const ROLES = ["admin", "supervisor", "operario"];

const ROLE_LABELS = { admin: "Administrador", supervisor: "Supervisor", operario: "Operario" };
const ROLE_COLORS = { admin: "bg-[#f8d7da] text-[#7a1a30]", supervisor: "bg-blue-100 text-blue-700", operario: "bg-gray-100 text-gray-600" };

export default function ConfigUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operario");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (user, newRole) => {
    await base44.entities.User.update(user.id, { role: newRole });
    load();
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg(null);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    setInviteMsg({ type: "success", text: `Invitación enviada a ${inviteEmail}` });
    setInviteEmail("");
    setInviting(false);
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="bg-[#fdf4f5] rounded-xl p-4 border border-[#f8d7da]">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Invitar nuevo usuario</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@empresa.com"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
          />
          <MobileSelect
            label="Rol"
            value={inviteRole}
            onChange={setInviteRole}
            options={ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] }))}
            placeholder="Seleccionar rol"
          />
          <button onClick={handleInvite} disabled={inviting || !inviteEmail} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50 whitespace-nowrap">
            <UserPlus className="w-3.5 h-3.5" /> Invitar
          </button>
        </div>
        {inviteMsg && (
          <p className={`text-xs mt-2 ${inviteMsg.type === "success" ? "text-green-700" : "text-red-600"}`}>{inviteMsg.text}</p>
        )}
      </div>

      {/* Users list */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Usuarios del sistema</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" /></div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Nombre</th>
                  <th className="px-4 py-2.5 text-left">Email</th>
                  <th className="px-4 py-2.5 text-left">Rol actual</th>
                  <th className="px-4 py-2.5 text-left">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{u.full_name || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[u.role] || u.role || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <MobileSelect
                        label="Cambiar rol"
                        value={u.role || "operario"}
                        onChange={v => handleRoleChange(u, v)}
                        options={ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] }))}
                        placeholder="Seleccionar"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}