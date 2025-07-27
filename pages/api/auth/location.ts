import { NextApiRequest, NextApiResponse } from 'next'

interface LocationData {
  country: string
  countryCode: string
  region: string
  city: string
  timezone: string
  dialCode: string
  isVPN: boolean
  ip: string
}

interface CountryInfo {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Complete list of all world countries with dial codes
const COUNTRIES: Record<string, CountryInfo> = {
  'AD': { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
  'AE': { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  'AF': { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  'AG': { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1268', flag: '🇦🇬' },
  'AI': { code: 'AI', name: 'Anguilla', dialCode: '+1264', flag: '🇦🇮' },
  'AL': { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
  'AM': { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  'AO': { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
  'AQ': { code: 'AQ', name: 'Antarctica', dialCode: '+672', flag: '🇦🇶' },
  'AR': { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  'AS': { code: 'AS', name: 'American Samoa', dialCode: '+1684', flag: '🇦🇸' },
  'AT': { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  'AU': { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  'AW': { code: 'AW', name: 'Aruba', dialCode: '+297', flag: '🇦🇼' },
  'AX': { code: 'AX', name: 'Åland Islands', dialCode: '+358', flag: '🇦🇽' },
  'AZ': { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿' },
  'BA': { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦' },
  'BB': { code: 'BB', name: 'Barbados', dialCode: '+1246', flag: '🇧🇧' },
  'BD': { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  'BE': { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  'BF': { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  'BG': { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  'BH': { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  'BI': { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
  'BJ': { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯' },
  'BL': { code: 'BL', name: 'Saint Barthélemy', dialCode: '+590', flag: '🇧🇱' },
  'BM': { code: 'BM', name: 'Bermuda', dialCode: '+1441', flag: '🇧🇲' },
  'BN': { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳' },
  'BO': { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  'BQ': { code: 'BQ', name: 'Caribbean Netherlands', dialCode: '+599', flag: '🇧🇶' },
  'BR': { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  'BS': { code: 'BS', name: 'Bahamas', dialCode: '+1242', flag: '🇧🇸' },
  'BT': { code: 'BT', name: 'Bhutan', dialCode: '+975', flag: '🇧🇹' },
  'BV': { code: 'BV', name: 'Bouvet Island', dialCode: '+47', flag: '🇧🇻' },
  'BW': { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
  'BY': { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾' },
  'BZ': { code: 'BZ', name: 'Belize', dialCode: '+501', flag: '🇧🇿' },
  'CA': { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  'CC': { code: 'CC', name: 'Cocos (Keeling) Islands', dialCode: '+61', flag: '🇨🇨' },
  'CD': { code: 'CD', name: 'Democratic Republic of the Congo', dialCode: '+243', flag: '🇨🇩' },
  'CF': { code: 'CF', name: 'Central African Republic', dialCode: '+236', flag: '🇨🇫' },
  'CG': { code: 'CG', name: 'Republic of the Congo', dialCode: '+242', flag: '🇨🇬' },
  'CH': { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  'CI': { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  'CK': { code: 'CK', name: 'Cook Islands', dialCode: '+682', flag: '🇨🇰' },
  'CL': { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  'CM': { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲' },
  'CN': { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  'CO': { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  'CR': { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  'CU': { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  'CV': { code: 'CV', name: 'Cape Verde', dialCode: '+238', flag: '🇨🇻' },
  'CW': { code: 'CW', name: 'Curaçao', dialCode: '+599', flag: '🇨🇼' },
  'CX': { code: 'CX', name: 'Christmas Island', dialCode: '+61', flag: '🇨🇽' },
  'CY': { code: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾' },
  'CZ': { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  'DE': { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  'DJ': { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  'DK': { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  'DM': { code: 'DM', name: 'Dominica', dialCode: '+1767', flag: '🇩🇲' },
  'DO': { code: 'DO', name: 'Dominican Republic', dialCode: '+1809', flag: '🇩🇴' },
  'DZ': { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  'EC': { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  'EE': { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  'EG': { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  'EH': { code: 'EH', name: 'Western Sahara', dialCode: '+212', flag: '🇪🇭' },
  'ER': { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
  'ES': { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  'ET': { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  'FI': { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  'FJ': { code: 'FJ', name: 'Fiji', dialCode: '+679', flag: '🇫🇯' },
  'FK': { code: 'FK', name: 'Falkland Islands', dialCode: '+500', flag: '🇫🇰' },
  'FM': { code: 'FM', name: 'Micronesia', dialCode: '+691', flag: '🇫🇲' },
  'FO': { code: 'FO', name: 'Faroe Islands', dialCode: '+298', flag: '🇫🇴' },
  'FR': { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  'GA': { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  'GB': { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  'GD': { code: 'GD', name: 'Grenada', dialCode: '+1473', flag: '🇬🇩' },
  'GE': { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  'GF': { code: 'GF', name: 'French Guiana', dialCode: '+594', flag: '🇬🇫' },
  'GG': { code: 'GG', name: 'Guernsey', dialCode: '+44', flag: '🇬🇬' },
  'GH': { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  'GI': { code: 'GI', name: 'Gibraltar', dialCode: '+350', flag: '🇬🇮' },
  'GL': { code: 'GL', name: 'Greenland', dialCode: '+299', flag: '🇬🇱' },
  'GM': { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲' },
  'GN': { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳' },
  'GP': { code: 'GP', name: 'Guadeloupe', dialCode: '+590', flag: '🇬🇵' },
  'GQ': { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', flag: '🇬🇶' },
  'GR': { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  'GS': { code: 'GS', name: 'South Georgia and the South Sandwich Islands', dialCode: '+500', flag: '🇬🇸' },
  'GT': { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  'GU': { code: 'GU', name: 'Guam', dialCode: '+1671', flag: '🇬🇺' },
  'GW': { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', flag: '🇬🇼' },
  'GY': { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾' },
  'HK': { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  'HM': { code: 'HM', name: 'Heard Island and McDonald Islands', dialCode: '+672', flag: '🇭🇲' },
  'HN': { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  'HR': { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷' },
  'HT': { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹' },
  'HU': { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  'ID': { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  'IE': { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮���' },
  'IL': { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  'IM': { code: 'IM', name: 'Isle of Man', dialCode: '+44', flag: '🇮🇲' },
  'IN': { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  'IO': { code: 'IO', name: 'British Indian Ocean Territory', dialCode: '+246', flag: '🇮🇴' },
  'IQ': { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  'IR': { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  'IS': { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸' },
  'IT': { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  'JE': { code: 'JE', name: 'Jersey', dialCode: '+44', flag: '🇯🇪' },
  'JM': { code: 'JM', name: 'Jamaica', dialCode: '+1876', flag: '🇯🇲' },
  'JO': { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  'JP': { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  'KE': { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  'KG': { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬' },
  'KH': { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  'KI': { code: 'KI', name: 'Kiribati', dialCode: '+686', flag: '🇰🇮' },
  'KM': { code: 'KM', name: 'Comoros', dialCode: '+269', flag: '🇰🇲' },
  'KN': { code: 'KN', name: 'Saint Kitts and Nevis', dialCode: '+1869', flag: '🇰🇳' },
  'KP': { code: 'KP', name: 'North Korea', dialCode: '+850', flag: '🇰🇵' },
  'KR': { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  'KW': { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  'KY': { code: 'KY', name: 'Cayman Islands', dialCode: '+1345', flag: '🇰🇾' },
  'KZ': { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  'LA': { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  'LB': { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  'LC': { code: 'LC', name: 'Saint Lucia', dialCode: '+1758', flag: '🇱🇨' },
  'LI': { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
  'LK': { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  'LR': { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
  'LS': { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸' },
  'LT': { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹' },
  'LU': { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  'LV': { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻' },
  'LY': { code: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾' },
  'MA': { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  'MC': { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
  'MD': { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩' },
  'ME': { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
  'MF': { code: 'MF', name: 'Saint Martin', dialCode: '+590', flag: '🇲🇫' },
  'MG': { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
  'MH': { code: 'MH', name: 'Marshall Islands', dialCode: '+692', flag: '🇲🇭' },
  'MK': { code: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '🇲🇰' },
  'ML': { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  'MM': { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  'MN': { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
  'MO': { code: 'MO', name: 'Macao', dialCode: '+853', flag: '🇲🇴' },
  'MP': { code: 'MP', name: 'Northern Mariana Islands', dialCode: '+1670', flag: '🇲🇵' },
  'MQ': { code: 'MQ', name: 'Martinique', dialCode: '+596', flag: '🇲🇶' },
  'MR': { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷' },
  'MS': { code: 'MS', name: 'Montserrat', dialCode: '+1664', flag: '🇲🇸' },
  'MT': { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
  'MU': { code: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺' },
  'MV': { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻' },
  'MW': { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼' },
  'MX': { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  'MY': { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  'MZ': { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
  'NA': { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  'NC': { code: 'NC', name: 'New Caledonia', dialCode: '+687', flag: '🇳🇨' },
  'NE': { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  'NF': { code: 'NF', name: 'Norfolk Island', dialCode: '+672', flag: '🇳🇫' },
  'NG': { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  'NI': { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  'NL': { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  'NO': { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  'NP': { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  'NR': { code: 'NR', name: 'Nauru', dialCode: '+674', flag: '🇳🇷' },
  'NU': { code: 'NU', name: 'Niue', dialCode: '+683', flag: '🇳🇺' },
  'NZ': { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  'OM': { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  'PA': { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦' },
  'PE': { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  'PF': { code: 'PF', name: 'French Polynesia', dialCode: '+689', flag: '🇵🇫' },
  'PG': { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', flag: '🇵🇬' },
  'PH': { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  'PK': { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  'PL': { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  'PM': { code: 'PM', name: 'Saint Pierre and Miquelon', dialCode: '+508', flag: '🇵🇲' },
  'PN': { code: 'PN', name: 'Pitcairn', dialCode: '+870', flag: '🇵🇳' },
  'PR': { code: 'PR', name: 'Puerto Rico', dialCode: '+1787', flag: '🇵🇷' },
  'PS': { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  'PT': { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  'PW': { code: 'PW', name: 'Palau', dialCode: '+680', flag: '🇵🇼' },
  'PY': { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  'QA': { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  'RE': { code: 'RE', name: 'Réunion', dialCode: '+262', flag: '🇷🇪' },
  'RO': { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  'RS': { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
  'RU': { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  'RW': { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  'SA': { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  'SB': { code: 'SB', name: 'Solomon Islands', dialCode: '+677', flag: '🇸🇧' },
  'SC': { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
  'SD': { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩' },
  'SE': { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  'SG': { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  'SH': { code: 'SH', name: 'Saint Helena', dialCode: '+290', flag: '🇸🇭' },
  'SI': { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮' },
  'SJ': { code: 'SJ', name: 'Svalbard and Jan Mayen', dialCode: '+47', flag: '🇸🇯' },
  'SK': { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  'SL': { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
  'SM': { code: 'SM', name: 'San Marino', dialCode: '+378', flag: '🇸🇲' },
  'SN': { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  'SO': { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  'SR': { code: 'SR', name: 'Suriname', dialCode: '+597', flag: '🇸🇷' },
  'SS': { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  'ST': { code: 'ST', name: 'São Tomé and Príncipe', dialCode: '+239', flag: '🇸🇹' },
  'SV': { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  'SX': { code: 'SX', name: 'Sint Maarten', dialCode: '+1721', flag: '🇸🇽' },
  'SY': { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  'SZ': { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: '🇸🇿' },
  'TC': { code: 'TC', name: 'Turks and Caicos Islands', dialCode: '+1649', flag: '🇹🇨' },
  'TD': { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩' },
  'TF': { code: 'TF', name: 'French Southern Territories', dialCode: '+262', flag: '🇹🇫' },
  'TG': { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  'TH': { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  'TJ': { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯' },
  'TK': { code: 'TK', name: 'Tokelau', dialCode: '+690', flag: '🇹🇰' },
  'TL': { code: 'TL', name: 'East Timor', dialCode: '+670', flag: '🇹🇱' },
  'TM': { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲' },
  'TN': { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  'TO': { code: 'TO', name: 'Tonga', dialCode: '+676', flag: '🇹🇴' },
  'TR': { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  'TT': { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1868', flag: '🇹🇹' },
  'TV': { code: 'TV', name: 'Tuvalu', dialCode: '+688', flag: '🇹🇻' },
  'TW': { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  'TZ': { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  'UA': { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  'UG': { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  'UM': { code: 'UM', name: 'United States Minor Outlying Islands', dialCode: '+1', flag: '🇺🇲' },
  'US': { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  'UY': { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  'UZ': { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  'VA': { code: 'VA', name: 'Vatican City', dialCode: '+379', flag: '🇻🇦' },
  'VC': { code: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '+1784', flag: '🇻🇨' },
  'VE': { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  'VG': { code: 'VG', name: 'British Virgin Islands', dialCode: '+1284', flag: '🇻🇬' },
  'VI': { code: 'VI', name: 'U.S. Virgin Islands', dialCode: '+1340', flag: '🇻🇮' },
  'VN': { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  'VU': { code: 'VU', name: 'Vanuatu', dialCode: '+678', flag: '🇻🇺' },
  'WF': { code: 'WF', name: 'Wallis and Futuna', dialCode: '+681', flag: '🇼🇫' },
  'WS': { code: 'WS', name: 'Samoa', dialCode: '+685', flag: '🇼🇸' },
  'XK': { code: 'XK', name: 'Kosovo', dialCode: '+383', flag: '🇽🇰' },
  'YE': { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
  'YT': { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
  'ZA': { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  'ZM': { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
  'ZW': { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
}

// VPN provider indicators
const VPN_INDICATORS = [
  'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'protonvpn',
  'mullvad', 'windscribe', 'tunnelbear', 'hotspot shield', 'purevpn',
  'ipvanish', 'vypr', 'amazon', 'google', 'microsoft', 'digitalocean',
  'vultr', 'linode', 'ovh', 'cloudflare', 'fastly', 'akamai'
]

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']
  const connectionIP = req.connection?.remoteAddress

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  
  return (realIP as string) || connectionIP || '127.0.0.1'
}

async function detectLocation(ip: string): Promise<Partial<LocationData>> {
  try {
    // Use multiple free IP geolocation services as fallback
    const services = [
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,isp,org,as,proxy`,
      `https://ipapi.co/${ip}/json/`,
    ]

    for (const serviceUrl of services) {
      try {
        const response = await fetch(serviceUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Solana-Wallet-App/1.0'
          }
        })

        if (!response.ok) continue

        const data = await response.json()

        // Handle ip-api.com response
        if (data.status === 'success' || data.country) {
          const countryCode = data.countryCode || data.country_code || 'US'
          const countryInfo = COUNTRIES[countryCode] || COUNTRIES['US']
          
          // Simple VPN detection based on ISP/org names
          const isp = (data.isp || data.org || '').toLowerCase()
          const isVPN = VPN_INDICATORS.some(indicator => 
            isp.includes(indicator) || 
            data.proxy === true ||
            isp.includes('vpn') ||
            isp.includes('proxy') ||
            isp.includes('hosting') ||
            isp.includes('server') ||
            isp.includes('datacenter')
          )

          return {
            country: data.country || countryInfo.name,
            countryCode,
            region: data.region || data.region_name || '',
            city: data.city || '',
            timezone: data.timezone || '',
            dialCode: countryInfo.dialCode,
            isVPN,
            ip
          }
        }
      } catch (serviceError) {
        console.warn(`Geolocation service failed:`, serviceError)
        continue
      }
    }

    // Fallback to US if all services fail
    return {
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip
    }

  } catch (error) {
    console.error('Location detection error:', error)
    // Return default US location on error
    return {
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const clientIP = getClientIP(req)
    const locationData = await detectLocation(clientIP)

    // Add country info
    const countryInfo = COUNTRIES[locationData.countryCode || 'US'] || COUNTRIES['US']

    res.status(200).json({
      ...locationData,
      countryInfo,
      availableCountries: Object.values(COUNTRIES),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Location API error:', error)
    
    // Return fallback data
    res.status(200).json({
      country: 'United States',
      countryCode: 'US',
      region: '',
      city: '',
      timezone: '',
      dialCode: '+1',
      isVPN: false,
      ip: getClientIP(req),
      countryInfo: COUNTRIES['US'],
      availableCountries: Object.values(COUNTRIES),
      timestamp: new Date().toISOString()
    })
  }
}

// Export country data for client-side use
export { COUNTRIES }
