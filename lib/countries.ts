export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
};

export const COUNTRIES: CountryOption[] = [
  { code: 'SN', name: 'Senegal', dialCode: '+221' },
  { code: 'CI', name: "Cote d'Ivoire", dialCode: '+225' },
  { code: 'ML', name: 'Mali', dialCode: '+223' },
  { code: 'GN', name: 'Guinee', dialCode: '+224' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'MA', name: 'Maroc', dialCode: '+212' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'BE', name: 'Belgique', dialCode: '+32' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44' },
  { code: 'US', name: 'Etats-Unis', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
