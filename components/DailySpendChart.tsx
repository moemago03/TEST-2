import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DailySpendChartProps {
    expenses: Expense[];
    trip: Trip;
}

const DailySpendChart: React.FC<DailySpendChartProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const chartData = useMemo(() => {
        if (expenses.length === 0) return [];
        
        const spendingByDay: { [key: string]: number } = {};
        expenses.forEach(e => {
            const date = new Date(e.date).toISOString().split('T')[0];
            const mainAmount = convert(e.amount, e.currency, trip.mainCurrency);
            spendingByDay[date] = (spendingByDay[date] || 0) + mainAmount;
        });

        return Object.entries(spendingByDay)
            .map(([date, amount]) => ({
                date,
                shortDate: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                amount,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
    }, [expenses, trip.mainCurrency, convert]);

    if (chartData.length === 0) {
        return null;
    }

     const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-surface p-3 rounded-xl border border-outline shadow-lg" role="tooltip">
            <p className="font-semibold text-on-surface">{new Date(payload[0].payload.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <p className="text-sm text-on-surface-variant">{`Speso: ${formatCurrency(payload[0].value, trip.mainCurrency)}`}</p>
          </div>
        );
      }
      return null;
    };

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Spesa Giornaliera</h2>
            <div className="w-full h-64" aria-label="Grafico a barre spesa giornaliera">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-surface-variant)" />
                        <XAxis dataKey="shortDate" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${value}`} tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--md-sys-color-surface-variant)' }} />
                        <Bar dataKey="amount" fill="var(--md-sys-color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DailySpendChart;