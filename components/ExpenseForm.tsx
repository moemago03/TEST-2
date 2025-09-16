import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Trip, Expense } from '../types';
import { CURRENCY_TO_COUNTRY } from '../constants';

interface ExpenseFormProps {
    trip: Trip;
    expense?: Expense;
    onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ trip, expense, onClose }) => {
    const { addExpense, updateExpense, data } = useData();

    const [amount, setAmount] = useState(expense?.amount.toString() || '');
    const [currency, setCurrency] = useState(expense?.currency || trip.mainCurrency);
    const [category, setCategory] = useState(expense?.category || data.categories[0]?.name || '');
    const [description, setDescription] = useState(expense?.description || '');
    const [date, setDate] = useState(expense ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // Handle case where a frequent expense click pre-fills the form
        if (expense && !expense.id) { // New expense pre-filled
            setAmount(expense.amount.toString());
            setCurrency(expense.currency);
            setCategory(expense.category);
            setDescription(expense.description);
            setDate(new Date(expense.date).toISOString().split('T')[0]);
        }
    }, [expense]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !category || !description.trim() || !date) {
            alert("Per favore, compila tutti i campi correttamente.");
            return;
        }

        const expenseData = {
            amount: numericAmount,
            currency,
            category,
            description: description.trim(),
            date: new Date(date).toISOString(),
            country: CURRENCY_TO_COUNTRY[currency] || undefined
        };

        if (expense && expense.id) { // Editing existing expense
            updateExpense(trip.id, { ...expense, ...expenseData });
        } else { // Adding new expense
            addExpense(trip.id, expenseData);
        }
        onClose();
    };

    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-on-surface">{expense && expense.id ? 'Modifica Spesa' : 'Aggiungi Spesa'}</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full -mr-2"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Importo</label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" className={inputClasses}/>
                        </div>
                        <div>
                            <label className={labelClasses}>Valuta</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)} required className={inputClasses}>
                                {trip.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Descrizione</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className={inputClasses}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Categoria</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} required className={inputClasses}>
                                {data.categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClasses}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-primary rounded-full hover:bg-primary-container">Annulla</button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-medium bg-primary text-on-primary rounded-full shadow-sm hover:shadow-md">{expense && expense.id ? 'Salva Modifiche' : 'Aggiungi Spesa'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;
