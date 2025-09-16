import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BudgetTrendChartProps {
    expenses: Expense[];
    trip: Trip;
}

const BudgetTrendChart: React.FC<BudgetTrendChartProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const chartData = useMemo(() => {
        if (!trip) return [];

        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
        // Calculate duration based on the actual start and end dates of the trip
        const totalTripDuration = Math.max(1, (tripEnd.getTime() - tripStart.getTime()) / (1000 * 3600 * 24) + 1);
        const idealDailyBurn = trip.totalBudget > 0 ? trip.totalBudget / totalTripDuration : 0;

        const dailySpending = new Map<string, number>();
        expenses.forEach(expense => {
            const date = new Date(expense.date).toISOString().split('T')[0];
            const amountInMain = convert(expense.amount, expense.currency, trip.mainCurrency);
            dailySpending.set(date, (dailySpending.get(date) || 0) + amountInMain);
        });

        const dataPoints = [];
        let cumulativeSpent = 0;
        let daysElapsed = 0;
        let currentDate = new Date(tripStart);

        const today = new Date();
        today.setHours(23, 59, 59, 999); // Ensure we include today fully
        
        // The last date for the chart should be today if the trip is ongoing, or the trip end date if it's over
        const lastDate = today < tripEnd ? today : tripEnd;

        // Don't render points for future dates if trip has not started
        if (lastDate < tripStart) return [];

        while (currentDate <= lastDate) {
            daysElapsed++;
            const dateStr = currentDate.toISOString().split('T')[0];
            const spentToday = dailySpending.get(dateStr) || 0;
            cumulativeSpent += spentToday;
            
            dataPoints.push({
                date: currentDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                fullDate: new Date(currentDate),
                'Spesa Reale': cumulativeSpent,
                'Spesa Ideale': idealDailyBurn * daysElapsed,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dataPoints;
    }, [expenses, trip, convert]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface p-3 rounded-xl border border-outline shadow-lg" role="tooltip">
                    <p className="font-semibold text-on-surface">{data.fullDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    {payload.map((pld: any) => (
                        <p key={pld.dataKey} style={{ color: pld.stroke || pld.fill }} className="text-sm">
                            {`${pld.name}: ${formatCurrency(pld.value, trip.mainCurrency)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Andamento Budget</h2>
            {chartData.length === 0 ? (
                 <div className="flex items-center justify-center h-64 text-on-surface-variant text-center">
                    <p>Nessuna spesa nel periodo selezionato per mostrare l'andamento.</p>
                </div>
            ) : (
                <div className="w-full h-64" aria-label="Grafico andamento budget">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 5, right: 20, left: 0, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-surface-variant)" />
                            <XAxis dataKey="date" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} />
                            <YAxis 
                                tickFormatter={(value) => new Intl.NumberFormat('it-IT', { notation: 'compact', compactDisplay: 'short' }).format(value)} 
                                tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} 
                                domain={[0, 'dataMax']} 
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{fontSize: "14px", paddingBottom: "10px"}} />
                            <defs>
                                <linearGradient id="realSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="Spesa Reale" stroke="var(--md-sys-color-primary)" fill="url(#realSpendingGradient)" strokeWidth={2.5} name="Spesa Reale" />
                            <Line type="monotone" dataKey="Spesa Ideale" stroke="var(--md-sys-color-tertiary)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Spesa Ideale" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default BudgetTrendChart;
