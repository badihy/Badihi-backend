export const AR_TRANSLATIONS: Record<string, string> = {
    Restaurants: "مطاعم",
    Hospitals: "مستشفيات",
    Doctors: "أطباء",
    Schools: "مدارس",
    "Service centers": "مراكز خدمة",
    Helpers: "خدمات مساعدة",
    Sports: "رياضة",
    Parties: "حفلات",
    "Government services": "خدمات حكومية",
    "Entertainment places": "أماكن ترفيه",
    "Homemade food": "أكل بيتي",
    Banks: "بنوك",
    "Car services": "خدمات السيارات",
    Pharmacies: "صيدليات",
    "Fashion & Beauty": "الموضة والجمال",
    Groceries: "بقالة",
    Cafés: "كافيهات",
    "Legal & Real Estate Services": "خدمات قانونية وعقارية",
    "Finishing & Decor": "تشطيبات وديكور",
};

export const NAME_FIXES: Record<string, string> = {
    "Sea Food": "Seafood",
    "Fast food": "Fast Food",
    "vegetarian": "Vegetarian",
    "kushk": "Kiosk",
    "Gomla": "Wholesale",
    "cafes": "Cafés",
    "paintssupplies": "Paint Supplies",
    "workshopandfactorysupplies": "Workshop & Factory Supplies",
    "mobilemaintenance": "Mobile Maintenance",
    "vetclinics": "Veterinary Clinics",
    "babysupplies": "Baby Supplies",
    "kidstoys": "Kids Toys",
    "Wanash": "Winch",
    "Simsar": "Broker",
};

export function normalizeCategoryName(name: string): string {
    const cleaned = name.trim();
    return NAME_FIXES[cleaned] ?? cleaned;
}
