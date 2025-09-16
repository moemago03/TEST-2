import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Trip, FrequentExpense, CategoryBudget } from '../types';
import { COUNTRIES_CURRENCIES, ALL_CURRENCIES } from '../constants';

interface TripFormProps {
    trip?: Trip;
    onClose: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onClose }) => {
    const { addTrip, updateTrip, data } = useData();
    const [name, setName] = useState(trip?.name || '');
    const [startDate, setStartDate] = useState(trip?.startDate.split('T')[0] || '');
    const [endDate, setEndDate] = useState(trip?.endDate.split('T')[0] || '');
    const [totalBudget, setTotalBudget] = useState(trip?.totalBudget || 0);
    const [countries, setCountries] = useState<string[]>(trip?.countries || []);
    const [mainCurrency, setMainCurrency] = useState(trip?.mainCurrency || 'EUR');
    const [preferredCurrencies, setPreferredCurrencies] = useState<string[]>(
        trip ? [...new Set([...trip.preferredCurrencies, trip.mainCurrency])] : ['EUR']
    );
    
    const [enableCategoryBudgets, setEnableCategoryBudgets] = useState(trip?.enableCategoryBudgets || false);
    const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(trip?.categoryBudgets || []);

    const totalAllocatedBudget = useMemo(() => {
        return categoryBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    }, [categoryBudgets]);

    const handleCategoryBudgetChange = (categoryName: string, amountStr: string) => {
        const amount = parseFloat(amountStr) || 0;
        const existing = categoryBudgets.find(b => b.categoryName === categoryName);
        let newBudgets;
        if (existing) {
            newBudgets = categoryBudgets.map(b => b.categoryName === categoryName ? { ...b, amount } : b);
        } else {
            newBudgets = [...categoryBudgets, { categoryName, amount }];
        }
        setCategoryBudgets(newBudgets.filter(b => b.amount > 0)); 
    };

    useEffect(() => {
        if (!preferredCurrencies.includes(mainCurrency)) {
            setPreferredCurrencies(prev => [...new Set([...prev, mainCurrency])]);
        }
    }, [mainCurrency, preferredCurrencies]);

    const handleCountryChange = (country: string) => {
        const newCountries = countries.includes(country)
            ? countries.filter(c => c !== country)
            : [...countries, country];
        setCountries(newCountries);

        const newSuggestedCurrencies = newCountries.map(c => COUNTRIES_CURRENCIES[c]).filter(Boolean);
        const newPreferred = [...new Set([mainCurrency, ...newSuggestedCurrencies, ...preferredCurrencies])];
        setPreferredCurrencies(newPreferred);
    };
    
    const handlePreferredCurrencyChange = (currency: string) => {
        if (currency === mainCurrency) return;
        
        const newPreferred = preferredCurrencies.includes(currency)
            ? preferredCurrencies.filter(c => c !== currency)
            : [...preferredCurrencies, currency];
        setPreferredCurrencies(newPreferred);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !startDate || !endDate || totalBudget <= 0 || countries.length === 0 || !mainCurrency) {
            alert("Per favore, compila tutti i campi obbligatori.");
            return;
        }

        const tripData = {
            name,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            totalBudget,
            countries,
            mainCurrency,
            preferredCurrencies: [...new Set([...preferredCurrencies, mainCurrency])],
            enableCategoryBudgets,
            categoryBudgets: enableCategoryBudgets ? categoryBudgets.filter(b => b.amount > 0) : [],
        };

        if (trip) {
            updateTrip({ ...trip, ...tripData });
        } else {
            addTrip(tripData as Omit<Trip, 'id' | 'expenses'>);
        }
        onClose();
    };

    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-on-surface">{trip ? 'Modifica Viaggio' : 'Nuovo Viaggio'}</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full -mr-2"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label className={labelClasses}>Nome Viaggio</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Data Inizio</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div>
                            <label className={labelClasses}>Data Fine</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClasses}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Budget Totale</label>
                            <input type="number" value={totalBudget} onChange={e => setTotalBudget(parseFloat(e.target.value))} required min="1" className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Valuta Principale</label>
                           <select value={mainCurrency} onChange={e => setMainCurrency(e.target.value)} required className={inputClasses}>
                                {ALL_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Paesi Visitati</label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Object.keys(COUNTRIES_CURRENCIES).map(country => (
                                <label key={country} className="flex items-center space-x-2 p-2 border border-outline rounded-lg cursor-pointer hover:bg-surface-variant">
                                    <input type="checkbox" checked={countries.includes(country)} onChange={() => handleCountryChange(country)} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                                    <span className="text-sm">{country}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className={labelClasses}>Valute Preferite</label>
                         <p className="text-xs text-on-surface-variant">Seleziona le valute che userai. La valuta principale è sempre inclusa.</p>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {ALL_CURRENCIES.map(currency => (
                                <label key={currency} className={`flex items-center space-x-2 p-2 border rounded-lg transition-colors ${currency === mainCurrency ? 'bg-surface-variant cursor-not-allowed' : 'cursor-pointer hover:bg-surface-variant'}`}>
                                    <input type="checkbox" checked={preferredCurrencies.includes(currency)} onChange={() => handlePreferredCurrencyChange(currency)} disabled={currency === mainCurrency} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                                    <span className="text-sm">{currency}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-surface-variant">
                        <div className="flex items-center">
                            <input type="checkbox" id="enable-category-budgets" checked={enableCategoryBudgets} onChange={e => setEnableCategoryBudgets(e.target.checked)} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                            <label htmlFor="enable-category-budgets" className="ml-2 block text-sm font-medium text-on-surface">Abilita Budget per Categoria</label>
                        </div>
                        {enableCategoryBudgets && (
                            <div className="mt-3 p-3 space-y-3 border border-surface-variant rounded-xl bg-surface-variant/50">
                                <p className="text-xs text-on-surface-variant">Assegna un budget specifico per ogni categoria.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                    {data?.categories.map(category => {
                                        const budget = categoryBudgets.find(b => b.categoryName === category.name);
                                        return (
                                            <div key={category.id}>
                                                <label className="block text-sm font-medium text-on-surface-variant">{category.icon} {category.name}</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={budget?.amount || ''}
                                                    onChange={e => handleCategoryBudgetChange(category.name, e.target.value)}
                                                    className={inputClasses}
                                                    step="1"
                                                    min="0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`mt-2 text-sm font-medium ${totalAllocatedBudget > totalBudget ? 'text-error' : 'text-on-surface-variant'}`}>
                                    Assegnato: {totalAllocatedBudget.toFixed(2)} / {totalBudget.toFixed(2)} {mainCurrency}
                                    {totalAllocatedBudget > totalBudget && <p className="text-xs">Attenzione: Il budget assegnato supera quello totale.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </form>
                <div className="flex justify-end gap-4 pt-6 mt-auto border-t border-surface-variant">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-primary rounded-full hover:bg-primary-container">Annulla</button>
                    <button type="submit" onClick={handleSubmit} className="px-6 py-2.5 text-sm font-medium bg-primary text-on-primary rounded-full shadow-sm hover:shadow-md">{trip ? 'Salva Modifiche' : 'Crea Viaggio'}</button>
                </div>
            </div>
        </div>
    );
};

export default TripForm;
