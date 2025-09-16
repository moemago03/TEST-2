import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { CURRENCY_TO_COUNTRY } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CountrySpendChartProps {
    expenses: Expense[];
    trip: Trip;
}

const CountrySpendChart: React.FC<CountrySpendChartProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const chartData = useMemo(() => {
        if (trip.countries.length <= 1) return [];

        const spendingByCountry: { [key: string]: number } = {};
        trip.countries.forEach(country => { spendingByCountry[country] = 0 });

        expenses.forEach(e => {
            const country = e.country || CURRENCY_TO_COUNTRY[e.currency];
            if (country && spendingByCountry.hasOwnProperty(country)) {
                const mainAmount = convert(e.amount, e.currency, trip.mainCurrency);
                spendingByCountry[country] += mainAmount;
            }
        });

        return Object.entries(spendingByCountry)
            .map(([country, amount]) => ({
                country,
                amount
            }))
            .filter(item => item.amount > 0)
            .sort((a,b) => b.amount - a.amount);
            
    }, [expenses, trip, convert]);

    if (chartData.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-surface p-3 rounded-xl border border-outline shadow-lg" role="tooltip">
            <p className="font-semibold text-on-surface">{payload[0].payload.country}</p>
            <p className="text-sm text-on-surface-variant">{`Speso: ${formatCurrency(payload[0].value, trip.mainCurrency)}`}</p>
          </div>
        );
      }
      return null;
    };

    return (
         <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Spesa per Paese</h2>
            <div className="w-full h-64" aria-label="Grafico a barre spesa per paese">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-surface-variant)" />
                        <XAxis type="number" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} />
                        <YAxis type="category" dataKey="country" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12, width: 80 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--md-sys-color-surface-variant)' }} />
                        <Bar dataKey="amount" fill="var(--md-sys-color-tertiary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CountrySpendChart;