import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const ROLES = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-700" },
  { value: "user", label: "Usuario", color: "bg-blue-100 text-blue-700" },
];

export default function ConfigUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, newRole) => {
    await base44.entities.User.update(id, { role: newRole });
    load();
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    setMsg(null);
    await base44.users.inviteUser(email.trim(), role);
    setMsg({ ok: true, text: `Invitación enviada a ${email}` });
    setEmail("");
    setInviting(false);
    load();
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Usuarios y Roles</h3>
        <p className="text-xs text-gray-500 mt-0.5">Invitá usuarios y administrá sus roles.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
        <p className="text-xs font-semibold text-gray-700">Invitar nuevo usuario</p>
        <div className="flex gap-2 flex-wrap">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className={`${inputCls} flex-1 min-w-48`} />
          <select value={role} onChange={e => setRole(e.target.value)} className={`${inputCls} w-32`}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={handleInvite} disabled={inviting || !email.trim()} className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60">
            {inviting ? "Enviando..." : "Invitar"}
          </button>
        </div>
        {msg && <p className={`text-xs ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" /></div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{u.email}</td>
                  <td className="px-3 py-2.5">
                    <select value={u.role || "user"} onChange={e => handleRoleChange(u.id, e.target.value)} className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c0392b]">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}