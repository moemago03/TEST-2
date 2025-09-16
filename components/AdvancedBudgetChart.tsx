import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface AdvancedBudgetChartProps {
    expenses: Expense[];
    trip: Trip;
    selectedDate: string | null;
    onDaySelect: (date: string | null) => void;
}

const AdvancedBudgetChart: React.FC<AdvancedBudgetChartProps> = ({ expenses, trip, selectedDate, onDaySelect }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const chartData = useMemo(() => {
        if (!trip) return [];

        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
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
        today.setHours(23, 59, 59, 999);
        
        const lastDate = today < tripEnd ? today : tripEnd;

        if (lastDate < tripStart) return [];

        while (currentDate <= lastDate) {
            daysElapsed++;
            const dateStr = currentDate.toISOString().split('T')[0];
            const spentToday = dailySpending.get(dateStr) || 0;
            cumulativeSpent += spentToday;
            
            dataPoints.push({
                date: currentDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                fullDate: new Date(currentDate),
                'Spesa Giornaliera': spentToday > 0 ? spentToday : null, // Use null to avoid tiny bars on zero-spend days
                'Spesa Cumulativa': cumulativeSpent,
                'Budget Cumulativo Ideale': idealDailyBurn * daysElapsed,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dataPoints;
    }, [expenses, trip, convert]);

    const handleBarClick = (data: any) => {
        if (data && data.fullDate) {
            const dateStr = data.fullDate.toISOString().split('T')[0];
            if (dateStr === selectedDate) {
                onDaySelect(null); // Deselect if clicking the same bar
            } else {
                onDaySelect(dateStr);
            }
        }
    };

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

    if (chartData.length === 0) {
        return (
            <div className="bg-surface p-6 rounded-3xl shadow-sm">
                <h2 className="text-xl font-semibold text-on-surface mb-4">Andamento Spesa Dettagliato</h2>
                <div className="flex items-center justify-center h-64 text-on-surface-variant text-center">
                    <p>Nessuna spesa nel periodo selezionato per mostrare il grafico.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Andamento Spesa Dettagliato</h2>
            <div className="w-full" style={{ height: '300px' }} aria-label="Grafico composito dell'andamento della spesa">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                        data={chartData} 
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-surface-variant)" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} 
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="var(--md-sys-color-primary)" 
                            tick={{ fill: 'var(--md-sys-color-primary)', fontSize: 12 }} 
                            width={50}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="var(--md-sys-color-tertiary)" 
                            tick={{ fill: 'var(--md-sys-color-tertiary)', fontSize: 12 }} 
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{fontSize: "14px", paddingBottom: "10px"}} />
                        <Bar yAxisId="left" dataKey="Spesa Giornaliera" barSize={20} onClick={handleBarClick} cursor="pointer">
                             {chartData.map((entry, index) => {
                                const isSelected = selectedDate === entry.fullDate.toISOString().split('T')[0];
                                return (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={isSelected ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)'} 
                                        fillOpacity={isSelected ? 1 : 0.7} 
                                    />
                                );
                            })}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="Spesa Cumulativa" stroke="var(--md-sys-color-tertiary)" strokeWidth={2.5} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="Budget Cumulativo Ideale" stroke="var(--md-sys-color-outline)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AdvancedBudgetChart;