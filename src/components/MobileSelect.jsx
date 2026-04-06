import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";

/**
 * MobileSelect — Drawer-based select for touch devices.
 * Props:
 *   label      : string — title shown in drawer header
 *   value      : string — current value
 *   onChange   : (value) => void
 *   options    : [{ value, label }]
 *   placeholder: string (optional)
 *   className  : string (optional, applied to trigger button)
 */
export default function MobileSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "-- Seleccionar --",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full border rounded-lg px-2 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#c0392b] bg-white ${className}`}
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-[#5c1020]">{label}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto" style={{ maxHeight: "55vh", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-5 py-3.5 text-sm text-gray-400 border-b hover:bg-gray-50 transition-colors"
            >
              {placeholder}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-5 py-3.5 text-sm flex items-center justify-between border-b hover:bg-gray-50 transition-colors"
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <Check className="w-4 h-4 text-[#c0392b] flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="h-6" />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}