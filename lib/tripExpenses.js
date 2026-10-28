export const EXPENSE_CATEGORIES = ['lodging', 'food', 'transport', 'activity', 'shopping', 'other'];

export function parseExpenseAmount(input) {
  let value = String(input ?? '').trim().replace(/\s/g, '');
  if (value.includes(',') && value.includes('.')) {
    value = value.lastIndexOf(',') > value.lastIndexOf('.')
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/,/g, '');
  } else if (value.includes(',')) {
    const decimals = value.length - value.lastIndexOf(',') - 1;
    value = decimals > 0 && decimals <= 2 ? value.replace(',', '.') : value.replace(/,/g, '');
  }
  return Number(value);
}

export function createTripExpense({ amount, currency, category, date, note = '', id = Date.now() + Math.random() }) {
  const value = parseExpenseAmount(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Expense amount must be greater than zero');
  if (!currency || !category || !date) throw new Error('Expense currency, category, and date are required');
  return { id, amount: Math.round(value * 100) / 100, currency, category, date, note: String(note).trim() };
}

export function filterTripExpenses(expenses, { query = '', category = 'all', currency = 'all', sort = 'newest' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = (expenses || []).filter(expense => {
    if (category !== 'all' && expense.category !== category) return false;
    if (currency !== 'all' && expense.currency !== currency) return false;
    if (!normalizedQuery) return true;
    return [expense.note, expense.date, expense.category, expense.currency, expense.amount]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(normalizedQuery));
  });
  return filtered.sort((a, b) => {
    if (sort === 'amount') return b.amount - a.amount;
    const dateOrder = String(a.date || '').localeCompare(String(b.date || ''));
    return sort === 'oldest' ? dateOrder : -dateOrder;
  });
}

export function summarizeTripExpenses(expenses) {
  const totals = {};
  const categories = {};
  (expenses || []).forEach(expense => {
    const currency = expense.currency || 'UNKNOWN';
    const amount = Number(expense.amount) || 0;
    totals[currency] = (totals[currency] || 0) + amount;
    if (!categories[currency]) categories[currency] = {};
    categories[currency][expense.category] = (categories[currency][expense.category] || 0) + amount;
  });
  return { totals, categories };
}
