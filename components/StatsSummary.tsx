import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';

interface StatsSummaryProps {
    expenses: Expense[];
    trip: Trip;
}

const StatItem: React.FC<{ icon: string; label: string; value: string | React.ReactNode; }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-3 bg-surface-variant/50 rounded-lg">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary-container text-on-secondary-container flex-shrink-0">
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-on-surface-variant">{label}</p>
            <p className="text-base font-semibold text-on-surface break-words">{value}</p>
        </div>
    </div>
);


const StatsSummary: React.FC<StatsSummaryProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    const { data: { categories } } = useData();

    const summary = useMemo(() => {
        if (expenses.length === 0) {
            return {
                largestExpense: null,
                highestSpendingDay: null,
                mostFrequentCategory: null,
                avgTransaction: 0,
            };
        }

        const expensesInMainCurrency = expenses.map(e => ({
            ...e,
            mainAmount: convert(e.amount, e.currency, trip.mainCurrency)
        }));

        // Largest Expense
        const largestExpense = [...expensesInMainCurrency].sort((a, b) => b.mainAmount - a.mainAmount)[0];

        // Highest Spending Day
        const spendingByDay: { [key: string]: number } = {};
        expensesInMainCurrency.forEach(e => {
            const date = new Date(e.date).toISOString().split('T')[0];
            spendingByDay[date] = (spendingByDay[date] || 0) + e.mainAmount;
        });
        const highestSpendingDayEntry = Object.entries(spendingByDay).sort((a, b) => b[1] - a[1])[0];
        
        // Most Frequent Category
        const categoryCounts: { [key: string]: number } = {};
        expenses.forEach(e => {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        });
        const mostFrequentCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
        const categoryIcon = categories.find(c => c.name === mostFrequentCategoryEntry[0])?.icon;


        // Average Transaction
        const totalSpent = expensesInMainCurrency.reduce((sum, e) => sum + e.mainAmount, 0);
        const avgTransaction = totalSpent / expenses.length;
        
        return {
            largestExpense,
            highestSpendingDay: { date: highestSpendingDayEntry[0], amount: highestSpendingDayEntry[1] },
            mostFrequentCategory: { name: mostFrequentCategoryEntry[0], count: mostFrequentCategoryEntry[1], icon: categoryIcon },
            avgTransaction,
        };

    }, [expenses, trip.mainCurrency, convert, categories]);
    
    if (expenses.length === 0) return null;

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Statistiche Chiave</h2>
            <div className="space-y-3">
                {summary.largestExpense && (
                    <StatItem 
                        icon="trending_up"
                        label="Spesa più grande"
                        value={
                             <>
                                {formatCurrency(summary.largestExpense.mainAmount, trip.mainCurrency)}
                                <span className="block text-xs font-normal text-on-surface-variant truncate">{summary.largestExpense.description}</span>
                            </>
                        }
                    />
                )}
                {summary.highestSpendingDay && (
                     <StatItem 
                        icon="calendar_month"
                        label="Giorno più costoso"
                        value={
                             <>
                                {formatCurrency(summary.highestSpendingDay.amount, trip.mainCurrency)}
                                <span className="block text-xs font-normal text-on-surface-variant">{new Date(summary.highestSpendingDay.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            </>
                        }
                    />
                )}
                 {summary.mostFrequentCategory && (
                     <StatItem 
                        icon="category"
                        label="Categoria più usata"
                        value={
                             <>
                               {summary.mostFrequentCategory.icon} {summary.mostFrequentCategory.name}
                               <span className="block text-xs font-normal text-on-surface-variant">{summary.mostFrequentCategory.count} transazioni</span>
                            </>
                        }
                    />
                )}
                {summary.avgTransaction > 0 && (
                    <StatItem 
                        icon="receipt_long"
                        label="Transazione media"
                        value={formatCurrency(summary.avgTransaction, trip.mainCurrency)}
                    />
                )}
            </div>
        </div>
    );
};

export default StatsSummary;