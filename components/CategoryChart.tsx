import React, { useMemo, useState } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

interface CategoryChartProps {
    expenses: Expense[];
    trip: Trip;
}

const colors = [
    '#3B82F6', // primary
    '#705574', // tertiary
    '#565E71', // secondary
    '#10B981', // Emerald 500
    '#F59E0B', // Amber 500
    '#8B5CF6', // Violet 500
    '#EC4899', // Pink 500
    '#EF4444', // Red 500
    '#6366F1', // Indigo 500
];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="text-lg font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--md-sys-color-on-surface-variant)" className="text-sm">
                {`${(payload.percentage).toFixed(1)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: `drop-shadow(0 4px 8px ${fill}80)` }}
            />
        </g>
    );
};


const CategoryChart: React.FC<CategoryChartProps> = ({ expenses, trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    const { data: { categories } } = useData();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const dataByCategory = useMemo(() => {
        const spending: { [key: string]: number } = {};
        expenses.forEach(exp => {
            const amountInMain = convert(exp.amount, exp.currency, trip.mainCurrency);
            spending[exp.category] = (spending[exp.category] || 0) + amountInMain;
        });

        const totalSpent = Object.values(spending).reduce((sum, amount) => sum + amount, 0);

        return Object.entries(spending)
            .map(([categoryName, amount]) => ({
                name: categoryName,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                icon: categories.find(c => c.name === categoryName)?.icon || '💸',
            }))
            .sort((a, b) => b.amount - a.amount);

    }, [expenses, trip.mainCurrency, convert, categories]);

     const detailedExpenses = useMemo(() => {
        if (!selectedCategory) return [];
        return expenses
            .filter(e => e.category === selectedCategory)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedCategory, expenses]);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    const onPieClick = (data: any) => {
        setSelectedCategory(data.name);
    };

    if (expenses.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-surface p-3 rounded-xl border border-outline shadow-lg" role="tooltip">
            <p className="font-semibold text-on-surface">{`${data.icon} ${data.name}`}</p>
            <p className="text-sm text-on-surface-variant">{`Speso: ${formatCurrency(data.amount, trip.mainCurrency)}`}</p>
          </div>
        );
      }
      return null;
    };

    // FIX: Cast Pie component to `any` to bypass incorrect type definitions in recharts
    // that are missing the `activeIndex` prop. This allows using the feature without TS errors.
    const PieComponent = Pie as any;

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm min-h-[356px]">
            {selectedCategory ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-on-surface truncate">Dettaglio: {selectedCategory}</h2>
                        <button onClick={() => setSelectedCategory(null)} className="text-sm font-medium text-primary hover:underline flex-shrink-0 ml-2">
                            &larr; Torna al grafico
                        </button>
                    </div>
                    {detailedExpenses.length > 0 ? (
                        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {detailedExpenses.map(exp => (
                                <li key={exp.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-surface-variant/50">
                                    <div>
                                        <p className="font-medium text-on-surface">{exp.description}</p>
                                        <p className="text-xs text-on-surface-variant">{new Date(exp.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <p className="font-semibold text-on-surface text-right ml-2">{formatCurrency(exp.amount, exp.currency)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-on-surface-variant py-8">Nessuna spesa in questa categoria per il periodo selezionato.</p>
                    )}
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold text-on-surface mb-4">Spese per Categoria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="w-full h-64" aria-label="Grafico a torta delle spese">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <PieComponent
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        data={dataByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="85%"
                                        fill="#8884d8"
                                        dataKey="amount"
                                        nameKey="name"
                                        onMouseEnter={onPieEnter}
                                        onMouseLeave={onPieLeave}
                                        onClick={onPieClick}
                                        className="cursor-pointer"
                                    >
                                        {dataByCategory.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={colors[index % colors.length]}
                                                style={{ transition: 'opacity 0.2s ease' }}
                                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                            />
                                        ))}
                                    </PieComponent>
                                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2" aria-label="Legenda del grafico">
                            {dataByCategory.map((item, index) => (
                                <div 
                                    key={item.name} 
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeIndex === index ? 'bg-surface-variant' : ''}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    onClick={() => onPieClick(item)}
                                >
                                     <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true"></div>
                                        <span className="font-medium text-on-surface-variant flex items-center gap-2 text-sm truncate">
                                            <span className="truncate">{item.icon} {item.name}</span>
                                        </span>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-semibold text-on-surface text-sm">{formatCurrency(item.amount, trip.mainCurrency)}</p>
                                        <p className="text-xs text-on-surface-variant">{item.percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CategoryChart;