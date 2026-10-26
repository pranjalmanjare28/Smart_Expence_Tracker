// Indian Rupee currency formatting with commas (e.g., ₹1,25,000.00)
export function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
}

// Indian standard date formatting (e.g. 26 Oct 2026)
export function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Short date & time (e.g. 26 Oct, 04:30 PM)
export function formatDateTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format relative date (Today, Yesterday, or 12 Oct)
export function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (isYesterday) {
    return `Yesterday, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return formatDateTime(dateString);
}
