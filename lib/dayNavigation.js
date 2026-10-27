export function getDayNavigation(days, dayDate) {
  const sorted = [...(days || [])].sort((a, b) => a.date.localeCompare(b.date));
  const index = sorted.findIndex(day => day.date === dayDate);

  return {
    index,
    total: sorted.length,
    previous: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
