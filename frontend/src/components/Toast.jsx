import React, { useState, useEffect } from "react";
import { Icons } from "../utils";

let toastHandler = null;

export const Toast = {
  show(message, type = "info", duration = 3500) {
    if (toastHandler) {
      toastHandler({ message, type, duration });
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastHandler = ({ message, type, duration }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    return () => {
      toastHandler = null;
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let bgBorder = "bg-white border-slate-200 text-slate-800";
        let icon = <span className="text-indigo-600">{Icons.shield}</span>;

        if (toast.type === "success") {
          bgBorder = "bg-emerald-50 border-emerald-200 text-emerald-900";
          icon = <span className="text-emerald-600">{Icons.checkCircle}</span>;
        } else if (toast.type === "error") {
          bgBorder = "bg-red-50 border-red-200 text-red-900";
          icon = <span className="text-red-600">{Icons.alertTriangle}</span>;
        } else if (toast.type === "warning") {
          bgBorder = "bg-amber-50 border-amber-200 text-amber-900";
          icon = <span className="text-amber-600">{Icons.alertTriangle}</span>;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-3 transition-all animate-fadeIn ${bgBorder}`}
          >
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-1">{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
}
