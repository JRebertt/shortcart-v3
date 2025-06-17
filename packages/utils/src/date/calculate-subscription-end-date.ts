export function calculateSubscriptionEndDate(
  startDate: Date,
  interval: 'monthly' | 'yearly' | 'lifetime'
): Date {
  const endDate = new Date(startDate);

  switch (interval) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'lifetime':
      endDate.setFullYear(endDate.getFullYear() + 100);
      break;
  }

  return endDate;
}
