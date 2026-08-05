let __formatter = (amount) => {
  if (amount == null) return 'PKR 0';
  return `PKR ${Number(amount).toLocaleString()}`;
};

export function setCurrencyFormatter(fn) {
  __formatter = fn;
}

export function formatCurrency(amount) {
  return __formatter(amount);
}
