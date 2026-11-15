/**
 * Toast Notification System
 */

export const Toast = {
  show(message, type = "info", duration = 3500) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-item px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-3 transition-all transform duration-200 translate-y-2 opacity-0";

    let bgBorder = "bg-white border-slate-200 text-slate-800";
    let iconSvg = `<svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    if (type === "success") {
      bgBorder = "bg-emerald-50 border-emerald-200 text-emerald-900";
      iconSvg = `<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else if (type === "error") {
      bgBorder = "bg-red-50 border-red-200 text-red-900";
      iconSvg = `<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>`;
    } else if (type === "warning") {
      bgBorder = "bg-amber-50 border-amber-200 text-amber-900";
      iconSvg = `<svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`;
    }

    toast.className += ` ${bgBorder}`;
    toast.innerHTML = `
      <div class="flex-shrink-0">${iconSvg}</div>
      <div class="flex-1">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
      toast.classList.add("translate-y-0", "opacity-100");
    });

    setTimeout(() => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};
