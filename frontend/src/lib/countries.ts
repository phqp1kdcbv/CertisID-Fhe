export const COUNTRY_CODES: Record<string, number> = {
  "Afghanistan": 4,
  "Albania": 8,
  "Algeria": 12,
  "Argentina": 32,
  "Australia": 36,
  "Austria": 40,
  "Bangladesh": 50,
  "Belgium": 56,
  "Brazil": 76,
  "Canada": 124,
  "Chile": 152,
  "China": 156,
  "Colombia": 170,
  "Denmark": 208,
  "Egypt": 818,
  "Finland": 246,
  "France": 250,
  "Germany": 276,
  "Greece": 300,
  "Hong Kong": 344,
  "India": 356,
  "Indonesia": 360,
  "Iran": 364,
  "Iraq": 368,
  "Ireland": 372,
  "Israel": 376,
  "Italy": 380,
  "Japan": 392,
  "Jordan": 400,
  "Kenya": 404,
  "Korea (South)": 410,
  "Kuwait": 414,
  "Malaysia": 458,
  "Mexico": 484,
  "Morocco": 504,
  "Netherlands": 528,
  "New Zealand": 554,
  "Nigeria": 566,
  "Norway": 578,
  "Pakistan": 586,
  "Peru": 604,
  "Philippines": 608,
  "Poland": 616,
  "Portugal": 620,
  "Qatar": 634,
  "Russia": 643,
  "Saudi Arabia": 682,
  "Singapore": 702,
  "South Africa": 710,
  "Spain": 724,
  "Sweden": 752,
  "Switzerland": 756,
  "Taiwan": 158,
  "Thailand": 764,
  "Turkey": 792,
  "Ukraine": 804,
  "United Arab Emirates": 784,
  "United Kingdom": 826,
  "United States": 840,
  "Vietnam": 704,
};

export const getCountryCode = (countryName: string): number => {
  const code = COUNTRY_CODES[countryName];
  if (!code) {
    console.warn(`Country code not found for: ${countryName}, defaulting to 0`);
    return 0;
  }
  return code;
};

export const getCountryNames = (): string[] => {
  return Object.keys(COUNTRY_CODES).sort();
};
