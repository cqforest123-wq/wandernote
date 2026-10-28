export const EXPENSE_CATEGORIES = ['lodging', 'food', 'transport', 'activity', 'shopping', 'other'];

export function parseExpenseAmount(input) {
  let value = String(input ?? '').trim().replace(/\s/g, '');
  if (value.includes(',') && value.includes('.')) {
    if (/^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(value)) value = value.replace(/\./g, '').replace(',', '.');
    else if (/^[+-]?\d{1,3}(,\d{3})+\.\d+$/.test(value)) value = value.replace(/,/g, '');
    else return NaN;
  } else if (value.includes(',')) {
    value = /^[+-]?[1-9]\d{0,2}(,\d{3})+$/.test(value) ? value.replace(/,/g, '') : value.replace(',', '.');
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return NaN;
  return Number(value);
}

export function createTripExpense({ amount, currency, category, date, note = '', id = Date.now() + Math.random() }) {
  const value = parseExpenseAmount(amount);
  const cents = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Expense amount must be greater than zero and within the supported range');
  if (!/^[A-Z]{3}$/.test(currency || '') || !EXPENSE_CATEGORIES.includes(category)) throw new Error('Invalid expense currency or category');
  const [year, month, day] = String(date || '').split('.').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(date || '') || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) throw new Error('Invalid expense date');
  return { id, amount: cents / 100, currency, category, date, note: String(note).trim().slice(0, 140) };
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
