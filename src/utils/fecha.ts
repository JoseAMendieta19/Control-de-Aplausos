const dos = (n: number) => String(n).padStart(2, '0');

// Convierte la fecha ISO guardada en la base a texto legible: 11/10/2026 14:05:32
export function formatearFechaHora(iso: string): string {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return 'Fecha desconocida';
  return (
    `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ` +
    `${dos(f.getHours())}:${dos(f.getMinutes())}:${dos(f.getSeconds())}`
  );
}