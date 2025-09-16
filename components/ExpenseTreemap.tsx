import React, { useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

interface ExpenseTreemapProps {
    expenses: Expense[];
    trip: Trip;
}

const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#705574', '#565E71', '#EF4444', '#6366F1'
];

const CustomTreemapContent = (props: any) => {
    const { depth, x, y, width, height, index, name, value, totalAmount } = props;

    // Don't render content for the root container if it's just a wrapper
    if (depth > 0) return null;

    const color = colors[index % colors.length];
    const textColor = '#FFFFFF'; // White text for better contrast on colored backgrounds
    const percentage = totalAmount > 0 ? (value / totalAmount * 100).toFixed(1) : 0;

    const showText = width > 70 && height > 40;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: 'var(--md-sys-color-surface)',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
                rx={8}
                ry={8}
            />
            {showText && (
                // FIX: The 'xmlns' attribute was removed from the div below as it's not a valid prop
                // in React's TypeScript definitions and caused a compilation error.
                <foreignObject x={x + 8} y={y + 8} width={width - 16} height={height - 16}>
                    <div style={{ color: textColor, fontSize: '14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div className="font-bold truncate">{name}</div>
                        <div className="text-xs font-semibold">{percentage}%</div>
                    </div>
                </foreignObject>
            )}
        </g>
    );
};


const ExpenseTreemap: React.FC<ExpenseTreemapProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const { treemapData, totalAmount } = useMemo(() => {
        const spending: { [key: string]: number } = {};
        let total = 0;
        expenses.forEach(exp => {
            const amountInMain = convert(exp.amount, exp.currency, trip.mainCurrency);
            spending[exp.category] = (spending[exp.category] || 0) + amountInMain;
            total += amountInMain;
        });

        const data = Object.entries(spending)
            .map(([categoryName, amount]) => ({
                name: categoryName,
                size: amount, // 'size' is the key recharts uses for treemap values
            }))
            .sort((a, b) => b.size - a.size);
        
        return { treemapData: data, totalAmount: total };
    }, [expenses, trip.mainCurrency, convert]);

    if (treemapData.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface p-3 rounded-xl border border-outline shadow-lg" role="tooltip">
                    <p className="font-semibold text-on-surface">{data.name}</p>
                    <p className="text-sm text-on-surface-variant">{`Speso: ${formatCurrency(data.size, trip.mainCurrency)}`}</p>
                </div>
            );
        }
        return null;
    };

    // FIX: Cast Treemap component to `any` to bypass incorrect type definitions in recharts
    // that are missing the `ratio` prop. This allows using the feature without TS errors.
    const TreemapComponent = Treemap as any;

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Mappa Spese per Categoria</h2>
            <div className="w-full h-64" aria-label="Mappa ad albero delle spese per categoria">
                <ResponsiveContainer width="100%" height="100%">
                    <TreemapComponent
                        data={treemapData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="var(--md-sys-color-surface)"
                        fill="var(--md-sys-color-primary-container)"
                        content={<CustomTreemapContent totalAmount={totalAmount} />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </TreemapComponent>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpenseTreemap;
