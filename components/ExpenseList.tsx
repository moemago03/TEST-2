import React, { useState } from 'react';
import { Trip, Expense } from '../types';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

interface ExpenseListProps {
    expenses: Expense[];
    trip: Trip;
    onEditExpense: (expense: Expense) => void;
}

const ExpenseItem: React.FC<{ 
    expense: Expense; 
    onEdit: () => void; 
    onDelete: () => void; 
    categoryIcon: string; 
    isSelected: boolean;
    onSelect: () => void;
}> = ({ expense, onEdit, onDelete, categoryIcon, isSelected, onSelect }) => {
    const { formatCurrency } = useCurrencyConverter();
    
    return (
        <li 
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-container' : 'hover:bg-surface-variant/50'}`}
            onClick={onSelect}
            aria-selected={isSelected}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 bg-secondary-container text-on-secondary-container text-xl rounded-full flex items-center justify-center">
                    {categoryIcon}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{expense.description}</p>
                    <p className="text-sm text-on-surface-variant">{new Date(expense.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-right flex-shrink-0">
                <div className="font-semibold text-on-surface">
                    {formatCurrency(expense.amount, expense.currency)}
                </div>
                {/* Container for action buttons, width and opacity are toggled */}
                <div className={`flex transition-all duration-300 ease-in-out overflow-hidden ${isSelected ? 'w-[72px] opacity-100' : 'w-0 opacity-0'}`}>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                        className="p-2 text-on-surface-variant hover:bg-surface rounded-full" 
                        aria-label="Modifica spesa"
                        disabled={!isSelected}
                        tabIndex={isSelected ? 0 : -1}
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                        className="p-2 text-on-surface-variant hover:bg-error-container rounded-full" 
                        aria-label="Elimina spesa"
                        disabled={!isSelected}
                        tabIndex={isSelected ? 0 : -1}
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>
        </li>
    );
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, trip, onEditExpense }) => {
    const { deleteExpense, data: { categories } } = useData();
    const [visibleCount, setVisibleCount] = useState(10);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

    const handleSelectExpense = (expenseId: string) => {
        setSelectedExpenseId(prevId => (prevId === expenseId ? null : expenseId));
    };

    const handleDelete = (expenseId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa spesa?")) {
            deleteExpense(trip.id, expenseId);
        }
    };

    const getCategoryIcon = (categoryName: string) => {
        return categories.find(c => c.name === categoryName)?.icon || '💸';
    }
    
    if (expenses.length === 0) {
        return (
            <div className="bg-surface p-6 rounded-3xl shadow-sm text-center">
                <h2 className="text-xl font-semibold text-on-surface">Lista Spese</h2>
                <p className="mt-2 text-on-surface-variant">Nessuna spesa registrata per questo viaggio. Aggiungine una per iniziare!</p>
            </div>
        );
    }

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Lista Spese</h2>
            <ul className="divide-y divide-surface-variant -mt-2">
                {expenses.slice(0, visibleCount).map(expense => (
                    <ExpenseItem 
                        key={expense.id} 
                        expense={expense} 
                        onEdit={() => onEditExpense(expense)}
                        onDelete={() => handleDelete(expense.id)}
                        categoryIcon={getCategoryIcon(expense.category)}
                        isSelected={selectedExpenseId === expense.id}
                        onSelect={() => handleSelectExpense(expense.id)}
                    />
                ))}
            </ul>
            {visibleCount < expenses.length && (
                <div className="mt-4 text-center">
                    <button onClick={() => setVisibleCount(c => c + 10)} className="px-6 py-2.5 bg-primary-container text-on-primary-container font-medium text-sm rounded-full shadow-sm hover:shadow-md transition-all">
                        Mostra Altri
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;