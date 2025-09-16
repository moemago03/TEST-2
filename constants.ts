
import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Cibo', icon: '🍔' },
    { id: 'cat-2', name: 'Alloggio', icon: '🏠' },
    { id: 'cat-3', name: 'Trasporti', icon: '🚆' },
    { id: 'cat-4', name: 'Attività', icon: '🏞️' },
    { id: 'cat-5', name: 'Shopping', icon: '🛍️' },
    { id: 'cat-6', name: 'Visti', icon: '🛂' },
    { id: 'cat-7', name: 'Assicurazione', icon: '🛡️' },
    { id: 'cat-8', name: 'Varie', icon: '📦' },
];

export const COUNTRIES_CURRENCIES: { [key: string]: string } = {
    'Thailandia': 'THB',
    'Vietnam': 'VND',
    'Cambogia': 'KHR',
    'Laos': 'LAK',
    'Malesia': 'MYR',
    'Singapore': 'SGD',
    'Indonesia': 'IDR',
    'Filippine': 'PHP',
    'Giappone': 'JPY',
    'Corea del Sud': 'KRW',
    'Cina': 'CNY',
    'Stati Uniti': 'USD',
    'Area Euro': 'EUR',
    'Regno Unito': 'GBP',
};

export const CURRENCY_TO_COUNTRY: { [key: string]: string } = Object.entries(
    COUNTRIES_CURRENCIES
).reduce((acc, [country, currency]) => {
    if (!acc[currency]) {
        acc[currency] = country;
    }
    return acc;
}, {} as { [key: string]: string });


export const ALL_CURRENCIES = ['EUR', 'USD', 'GBP', 'THB', 'VND', 'KHR', 'LAK', 'MYR', 'SGD', 'IDR', 'PHP', 'JPY', 'KRW', 'CNY'];

// Mock exchange rates relative to EUR
export const MOCK_EXCHANGE_RATES: { [key: string]: number } = {
    'EUR': 1,
    'USD': 1.08,
    'GBP': 0.85,
    'THB': 39.50,
    'VND': 27500,
    'KHR': 4400,
    'LAK': 23500,
    'MYR': 5.10,
    'SGD': 1.46,
    'IDR': 17500,
    'PHP': 63.50,
    'JPY': 168.0,
    'KRW': 1480,
    'CNY': 7.80,
};