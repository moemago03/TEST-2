import React, { useState, useMemo, useEffect } from 'react';
import { Trip } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useCurrency } from '../context/CurrencyContext';

interface CurrencyConverterProps {
    trip: Trip;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ trip }) => {
    const [amount, setAmount] = useState('100');
    
    const [fromCurrency, setFromCurrency] = useState(() => {
        const saved = localStorage.getItem(`vsc_converter_from_${trip.id}`);
        return saved && trip.preferredCurrencies.includes(saved) ? saved : trip.mainCurrency;
    });
    
    const [toCurrency, setToCurrency] = useState(() => {
        const saved = localStorage.getItem(`vsc_converter_to_${trip.id}`);
        const defaultTo = trip.preferredCurrencies.find(c => c !== fromCurrency) || trip.preferredCurrencies[0] || 'USD';
        return saved && trip.preferredCurrencies.includes(saved) && saved !== fromCurrency ? saved : defaultTo;
    });
    
    const { convert } = useCurrencyConverter();
    const { lastUpdated, isUpdating, updateRates } = useCurrency();

    useEffect(() => {
        localStorage.setItem(`vsc_converter_from_${trip.id}`, fromCurrency);
        localStorage.setItem(`vsc_converter_to_${trip.id}`, toCurrency);
    }, [fromCurrency, toCurrency, trip.id]);

    const numericAmount = parseFloat(amount) || 0;

    const convertedAmount = useMemo(() => {
        if (numericAmount > 0) {
            return convert(numericAmount, fromCurrency, toCurrency);
        }
        return 0;
    }, [numericAmount, fromCurrency, toCurrency, convert]);

    const swapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    const handleFromChange = (newFrom: string) => {
        if (newFrom === toCurrency) {
            setToCurrency(fromCurrency); // Swap if they become the same
        }
        setFromCurrency(newFrom);
    };

    const handleToChange = (newTo: string) => {
        if (newTo === fromCurrency) {
            setFromCurrency(toCurrency); // Swap if they become the same
        }
        setToCurrency(newTo);
    };

    const labelClasses = "block text-sm font-medium text-on-surface-variant mb-1 ml-1";
    const sharedInputHeight = "h-12"; // Ensure all inputs have the same height

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-on-surface">Convertitore Valuta</h2>
                 <button onClick={updateRates} disabled={isUpdating} className="text-sm font-medium text-primary hover:underline disabled:opacity-50" aria-label="Aggiorna tassi di cambio">
                    {isUpdating ? 'Aggiornando...' : 'Aggiorna'}
                </button>
            </div>
           
            <div className="space-y-2">
                {/* From Section */}
                <div className="flex items-end gap-3">
                    <div className="flex-grow">
                        <label htmlFor="amount-input" className={labelClasses}>Importo</label>
                        <input
                            id="amount-input"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className={`w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-lg ${sharedInputHeight}`}
                            placeholder="0.00"
                        />
                    </div>
                     <div className="w-28 flex-shrink-0">
                        <label htmlFor="from-currency" className={labelClasses}>Da</label>
                        <select
                            id="from-currency"
                            aria-label="Valuta di partenza"
                            value={fromCurrency}
                            onChange={e => handleFromChange(e.target.value)}
                            className={`w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary ${sharedInputHeight}`}
                        >
                            {trip.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Swap Button & Divider */}
                <div className="flex items-center gap-3 py-1">
                    <hr className="flex-grow border-outline/50" />
                    <button onClick={swapCurrencies} className="p-2 rounded-full hover:bg-surface-variant transition-colors" aria-label="Inverti valute">
                        <span className="material-symbols-outlined text-on-surface-variant">swap_vert</span>
                    </button>
                    <hr className="flex-grow border-outline/50" />
                </div>

                {/* To Section */}
                <div className="flex items-end gap-3">
                    <div className="flex-grow">
                        <label className={labelClasses}>Risultato</label>
                         <div className={`w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 text-on-surface font-bold text-xl flex items-center overflow-x-auto whitespace-nowrap ${sharedInputHeight}`}>
                           {new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount)}
                        </div>
                    </div>
                     <div className="w-28 flex-shrink-0">
                        <label htmlFor="to-currency" className={labelClasses}>A</label>
                        <select
                            id="to-currency"
                            aria-label="Valuta di destinazione"
                            value={toCurrency}
                            onChange={e => handleToChange(e.target.value)}
                            className={`w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary ${sharedInputHeight}`}
                        >
                            {trip.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {lastUpdated && (
                 <p className="text-xs text-on-surface-variant text-center mt-4">
                    Tassi aggiornati al: {new Date(lastUpdated).toLocaleString('it-IT')}
                </p>
            )}
        </div>
    );
};

export default CurrencyConverter;