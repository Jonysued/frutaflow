import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScan, active }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (instanceRef.current && runningRef.current) {
        instanceRef.current.stop().catch(() => {});
        runningRef.current = false;
      }
      return;
    }

    const scannerId = "qr-scanner-" + Math.random().toString(36).slice(2);
    if (scannerRef.current) scannerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    instanceRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => { onScan(decodedText); },
      () => {}
    ).then(() => {
      runningRef.current = true;
    }).catch(console.error);

    return () => {
      if (instanceRef.current && runningRef.current) {
        instanceRef.current.stop().catch(() => {});
        runningRef.current = false;
      }
    };
  }, [active]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div ref={scannerRef} className="rounded-xl overflow-hidden border-2 border-[#c0392b]" />
    </div>
  );
}