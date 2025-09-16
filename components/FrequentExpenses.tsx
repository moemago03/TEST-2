import React from 'react';
import { FrequentExpense, Expense } from '../types';

interface FrequentExpensesProps {
    frequentExpenses: FrequentExpense[];
    onFrequentExpenseClick: (expense: Partial<Omit<Expense, 'id'>>) => void;
}

const FrequentExpenses: React.FC<FrequentExpensesProps> = ({ frequentExpenses, onFrequentExpenseClick }) => {
    if (!frequentExpenses || frequentExpenses.length === 0) {
        return null;
    }

    const handleClick = (freqExp: FrequentExpense) => {
        onFrequentExpenseClick({
            description: freqExp.name,
            category: freqExp.category,
            amount: freqExp.amount,
        });
    };

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-3">Spese Frequenti</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {frequentExpenses.map(freqExp => (
                    <button
                        key={freqExp.id}
                        onClick={() => handleClick(freqExp)}
                        className="flex flex-col items-center justify-center p-3 border border-outline rounded-2xl text-center hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label={`Aggiungi spesa rapida: ${freqExp.name}`}
                    >
                        <span className="text-3xl mb-1" aria-hidden="true">{freqExp.icon}</span>
                        <span className="text-sm font-medium text-on-surface-variant truncate w-full">{freqExp.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FrequentExpenses;
