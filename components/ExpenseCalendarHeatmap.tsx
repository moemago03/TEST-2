import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

interface ExpenseCalendarHeatmapProps {
    expenses: Expense[];
    trip: Trip;
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const ExpenseCalendarHeatmap: React.FC<ExpenseCalendarHeatmapProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const { dailyData, maxSpend } = useMemo(() => {
        const data = new Map<string, number>();
        let max = 0;

        expenses.forEach(expense => {
            const date = new Date(expense.date).toISOString().split('T')[0];
            const amount = convert(expense.amount, expense.currency, trip.mainCurrency);
            const currentTotal = data.get(date) || 0;
            const newTotal = currentTotal + amount;
            data.set(date, newTotal);
            if (newTotal > max) {
                max = newTotal;
            }
        });
        return { dailyData: data, maxSpend: max };
    }, [expenses, trip.mainCurrency, convert]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        
        let currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0);

        // Adjust for locale where Monday is the first day of the week (1). Sunday is 0.
        const firstDayOfWeek = (start.getDay() + 6) % 7; 
        
        // Add empty cells for the first week's offset
        for (let i = 0; i < firstDayOfWeek; i++) {
            grid.push({ type: 'empty' });
        }

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const amount = dailyData.get(dateStr) || 0;
            grid.push({ 
                type: 'day',
                date: new Date(currentDate),
                amount
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return grid;
    }, [trip.startDate, trip.endDate, dailyData]);

    const getColor = (amount: number) => {
        if (amount <= 0) {
            return 'bg-surface-variant/50';
        }
        const intensity = Math.sqrt(amount / maxSpend); // Use sqrt for better color distribution

        if (intensity < 0.25) return 'bg-primary-container/40';
        if (intensity < 0.5) return 'bg-primary-container/70';
        if (intensity < 0.75) return 'bg-primary-container';
        return 'bg-primary';
    };
    
    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Mappa di Calore Spese</h2>
            <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-1.5" style={{ minWidth: '320px' }}>
                    {WEEK_DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-on-surface-variant pb-2">{day}</div>
                    ))}
                    {calendarGrid.map((item, index) => {
                        if (item.type === 'empty') {
                            return <div key={`empty-${index}`} className="aspect-square"></div>;
                        }
                        const { date, amount } = item;
                        return (
                             <div 
                                key={date.toISOString()} 
                                className={`aspect-square rounded-md ${getColor(amount)} transition-colors group relative`}
                                title={`${date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}: ${formatCurrency(amount, trip.mainCurrency)}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-on-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {date.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end items-center gap-2 mt-4 text-xs text-on-surface-variant">
                    <span>Meno</span>
                    <div className="w-4 h-4 rounded-sm bg-primary-container/40"></div>
                    <div className="w-4 h-4 rounded-sm bg-primary-container/70"></div>
                    <div className="w-4 h-4 rounded-sm bg-primary-container"></div>
                    <div className="w-4 h-4 rounded-sm bg-primary"></div>
                    <span>Più</span>
                </div>
            </div>
        </div>
    );
};

export default ExpenseCalendarHeatmap;