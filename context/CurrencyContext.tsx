import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { MOCK_EXCHANGE_RATES } from '../constants';

interface ExchangeRates {
    rates: { [key: string]: number };
    lastUpdated: string;
}

interface CurrencyContextProps {
    rates: { [key: string]: number };
    lastUpdated: string | null;
    isUpdating: boolean;
    updateRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vsc_exchange_rates';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rates, setRates] = useState<{ [key: string]: number }>(MOCK_EXCHANGE_RATES);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // On initial load, try to get rates from local storage for offline use.
        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                const parsedData: ExchangeRates = JSON.parse(storedData);
                setRates(parsedData.rates);
                setLastUpdated(parsedData.lastUpdated);
            }
        } catch (error) {
            console.error("Failed to load exchange rates from local storage", error);
            // Fallback to mocks is already handled by initial state
        }
    }, []);

    const updateRates = useCallback(async () => {
        setIsUpdating(true);
        // In a real app, this would be an API call.
        // We'll simulate it with a short delay.
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const newRates = MOCK_EXCHANGE_RATES; // The "fetched" data
        const newLastUpdated = new Date().toISOString();

        try {
            const dataToStore: ExchangeRates = {
                rates: newRates,
                lastUpdated: newLastUpdated
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
            setRates(newRates);
            setLastUpdated(newLastUpdated);
        } catch (error) {
            console.error("Failed to save exchange rates to local storage", error);
            alert("Could not save updated exchange rates.");
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const value = { rates, lastUpdated, isUpdating, updateRates };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
