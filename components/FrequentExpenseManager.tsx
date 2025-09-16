import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Trip, FrequentExpense } from '../types';

interface FrequentExpenseManagerProps {
    activeTrip: Trip;
    onClose: () => void;
}

const FrequentExpenseManager: React.FC<FrequentExpenseManagerProps> = ({ activeTrip, onClose }) => {
    const { data, updateTrip } = useData();
    const [frequentExpenses, setFrequentExpenses] = useState<FrequentExpense[]>(activeTrip.frequentExpenses || []);
    
    // Form state
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [category, setCategory] = useState(data?.categories[0]?.name || '');
    const [amount, setAmount] = useState('');
    
    const handleSave = (updatedFrequentExpenses: FrequentExpense[]) => {
        const updatedTrip = { ...activeTrip, frequentExpenses: updatedFrequentExpenses };
        updateTrip(updatedTrip);
        setFrequentExpenses(updatedFrequentExpenses);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!name.trim() || !icon.trim() || !category.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert("Per favore, compila tutti i campi. L'importo deve essere valido.");
            return;
        }
        
        const newFrequentExpense: FrequentExpense = {
            id: Date.now().toString(),
            name: name.trim(),
            icon: icon.trim(),
            category: category.trim(),
            amount: numericAmount,
        };

        handleSave([...frequentExpenses, newFrequentExpense]);
        
        setName('');
        setIcon('');
        setAmount('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa spesa frequente?")) {
            const updated = frequentExpenses.filter(fe => fe.id !== id);
            handleSave(updated);
        }
    };

    const inputClasses = "bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-surface p-6 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="fe-manager-title">
                <div className="flex justify-between items-center mb-4">
                    <h2 id="fe-manager-title" className="text-2xl font-bold text-on-surface">Gestisci Spese Frequenti</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full -mr-2" aria-label="Chiudi"><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="overflow-y-auto pr-2">
                    <form onSubmit={handleAdd} className="mb-6 p-4 border border-surface-variant rounded-2xl bg-surface-variant/50 space-y-4">
                        <h3 className="font-semibold text-lg text-on-surface">Aggiungi Spesa Frequente</h3>
                        <p className="text-sm text-on-surface-variant">Crea pulsanti rapidi per le spese che fai più spesso.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                            <input type="text" placeholder="Nome (es. Pranzo)" value={name} onChange={e => setName(e.target.value)} className={`${inputClasses}`}/>
                            <input type="text" placeholder="Icona (es. 🍔)" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} className={`${inputClasses}`}/>
                            <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputClasses}`}>
                              {data?.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <input type="number" placeholder="Importo" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" className={`${inputClasses}`}/>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="w-full sm:w-auto px-6 py-2.5 text-sm bg-primary text-on-primary rounded-full hover:shadow-md font-semibold">Aggiungi</button>
                        </div>
                    </form>

                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-on-surface">Spese Frequenti Esistenti</h3>
                        {frequentExpenses.length > 0 ? (
                            <ul className="space-y-2">
                                {frequentExpenses.map(fe => (
                                    <li key={fe.id} className="p-2 rounded-lg hover:bg-surface-variant flex items-center justify-between border border-surface-variant">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3" aria-hidden="true">{fe.icon}</span>
                                            <span className="font-medium text-on-surface-variant">{fe.name} ({fe.category}) - {fe.amount.toFixed(2)}</span>
                                        </div>
                                        <button onClick={() => handleDelete(fe.id)} className="text-sm text-error hover:underline font-semibold">Elimina</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-on-surface-variant text-center py-4">Non hai ancora spese frequenti per questo viaggio.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FrequentExpenseManager;
