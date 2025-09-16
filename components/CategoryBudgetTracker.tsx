import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';

interface CategoryBudgetTrackerProps {
    trip: Trip;
    expenses: Expense[];
}

const ProgressBar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => (
    <div className="w-full bg-surface-variant rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
    </div>
);

const CategoryBudgetTracker: React.FC<CategoryBudgetTrackerProps> = ({ trip, expenses }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    const { data: { categories } } = useData();

    const spentByCategory = useMemo(() => {
        const spending: { [key: string]: number } = {};
        expenses.forEach(exp => {
            const amountInMain = convert(exp.amount, exp.currency, trip.mainCurrency);
            spending[exp.category] = (spending[exp.category] || 0) + amountInMain;
        });
        return spending;
    }, [expenses, trip.mainCurrency, convert]);

    const budgetItems = useMemo(() => {
        if (!trip.categoryBudgets) return [];
        return trip.categoryBudgets.map(budget => {
            const spent = spentByCategory[budget.categoryName] || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const category = categories.find(c => c.name === budget.categoryName);
            
            let color = 'bg-primary';
            if (percentage > 75) color = 'bg-tertiary'; // a warning color
            if (percentage >= 100) color = 'bg-error';
            
            return {
                ...budget,
                spent,
                percentage,
                icon: category?.icon || '💸',
                color,
            };
        }).sort((a,b) => b.percentage - a.percentage);
    }, [trip.categoryBudgets, spentByCategory, categories]);

    if (budgetItems.length === 0) return null;

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Budget per Categoria</h2>
            <div className="space-y-4">
                {budgetItems.map(item => (
                    <div key={item.categoryName}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-on-surface">{item.icon} {item.categoryName}</span>
                            <span className={`text-sm font-semibold ${item.percentage >= 100 ? 'text-error' : 'text-on-surface-variant'}`}>
                                {item.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <ProgressBar percentage={item.percentage} color={item.color} />
                        <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                            <span>{formatCurrency(item.spent, trip.mainCurrency)}</span>
                            <span>{formatCurrency(item.amount, trip.mainCurrency)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryBudgetTracker;
