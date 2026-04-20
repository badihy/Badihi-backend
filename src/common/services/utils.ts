export const AR_TRANSLATIONS: Record<string, string> = {
  Restaurants: 'Restaurants',
  Hospitals: 'Hospitals',
  Doctors: 'Doctors',
  Schools: 'Schools',
  'Service centers': 'Service Centers',
  Helpers: 'Support Services',
  Sports: 'Sports',
  Parties: 'Parties',
  'Government services': 'Government Services',
  'Entertainment places': 'Entertainment Places',
  'Homemade food': 'Homemade Food',
  Banks: 'Banks',
  'Car services': 'Car Services',
  Pharmacies: 'Pharmacies',
  'Fashion & Beauty': 'Fashion & Beauty',
  Groceries: 'Groceries',
  Cafés: 'Cafes',
  'Legal & Real Estate Services': 'Legal & Real Estate Services',
  'Finishing & Decor': 'Finishing & Decor',
};

export const NAME_FIXES: Record<string, string> = {
  'Sea Food': 'Seafood',
  'Fast food': 'Fast Food',
  vegetarian: 'Vegetarian',
  kushk: 'Kiosk',
  Gomla: 'Wholesale',
  cafes: 'Cafés',
  paintssupplies: 'Paint Supplies',
  workshopandfactorysupplies: 'Workshop & Factory Supplies',
  mobilemaintenance: 'Mobile Maintenance',
  vetclinics: 'Veterinary Clinics',
  babysupplies: 'Baby Supplies',
  kidstoys: 'Kids Toys',
  Wanash: 'Winch',
  Simsar: 'Broker',
};

export function normalizeCategoryName(name: string): string {
  const cleaned = name.trim();
  return NAME_FIXES[cleaned] ?? cleaned;
}
