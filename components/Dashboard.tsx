import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { Expense, Trip } from '../types';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import CategoryChart from './CategoryChart';
import CurrencyConverter from './CurrencyConverter';
import QuickExpense from './QuickExpense';
import FrequentExpenses from './FrequentExpenses';
import CategoryBudgetTracker from './CategoryBudgetTracker';
import StatsSummary from './StatsSummary';
import CountrySpendChart from './CountrySpendChart';
import AdvancedBudgetChart from './AdvancedBudgetChart';
import AIInsights from './AIInsights';
import ExpenseCalendarHeatmap from './ExpenseCalendarHeatmap';
import AIForecast from './AIForecast';
import ExpenseTreemap from './ExpenseTreemap';


interface DashboardProps {
    activeTripId: string;
    onToggleSidebar: () => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; icon: string }> = ({ title, value, color, icon }) => (
    <div className={`p-4 rounded-2xl flex items-center gap-4 bg-surface-variant shadow-sm`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-sm text-on-surface-variant">{title}</p>
            <p className="text-xl font-bold text-on-surface">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ activeTripId, onToggleSidebar }) => {
    const { data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
    const [activeTab, setActiveTab] = useState('summary');
    
    // Filters state
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    // State for daily detail view
    const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);


    const activeTrip = useMemo(() => data.trips.find(t => t.id === activeTripId), [data.trips, activeTripId]);

    const stats = useMemo(() => {
        if (!activeTrip) return { totalSpent: 0, budget: 0, remaining: 0, dailyAvg: 0 };
        
        const totalSpent = activeTrip.expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, activeTrip.mainCurrency), 0);
        const budget = activeTrip.totalBudget;
        const remaining = budget - totalSpent;
        
        const tripStart = new Date(activeTrip.startDate).getTime();
        const now = new Date().getTime();
        const tripEnd = new Date(activeTrip.endDate).getTime();
        
        let daysElapsed = (now - tripStart) / (1000 * 3600 * 24);
        if (now < tripStart) daysElapsed = 0;
        if (now > tripEnd) daysElapsed = (tripEnd - tripStart) / (1000 * 3600 * 24);
        daysElapsed = Math.max(1, Math.ceil(daysElapsed)); // At least one day

        const dailyAvg = totalSpent / daysElapsed;

        return { totalSpent, budget, remaining, dailyAvg };
    }, [activeTrip, convert]);
    
    const sortedExpenses = useMemo(() => {
        if (!activeTrip) return [];
        return [...activeTrip.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeTrip]);

    const filteredExpenses = useMemo(() => {
        let expenses = sortedExpenses;
        const now = new Date();

        if (dateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            expenses = expenses.filter(e => e.date.startsWith(todayStr));
        } else if (dateFilter === 'week') {
            const firstDayOfWeek = new Date(now);
            // In JS, Sunday is 0. We consider Monday (1) the start of the week.
            const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
            firstDayOfWeek.setDate(diff);
            firstDayOfWeek.setHours(0, 0, 0, 0);
            expenses = expenses.filter(e => new Date(e.date) >= firstDayOfWeek);
        } else if (dateFilter === 'month') {
            expenses = expenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
            });
        }

        if (selectedCategories.length > 0) {
            expenses = expenses.filter(e => selectedCategories.includes(e.category));
        }

        return expenses;
    }, [sortedExpenses, dateFilter, selectedCategories]);
    
    const expensesForSelectedDay = useMemo(() => {
        if (!selectedDayForDetail) return [];
        return filteredExpenses.filter(e => e.date.startsWith(selectedDayForDetail));
    }, [filteredExpenses, selectedDayForDetail]);
    
    const getCategoryIcon = (categoryName: string) => {
        return data.categories.find(c => c.name === categoryName)?.icon || '💸';
    };

    const uniqueCategoriesInTrip = useMemo(() => {
        if (!activeTrip) return [];
        return [...new Set(activeTrip.expenses.map(e => e.category))];
    }, [activeTrip]);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    if (!activeTrip) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Viaggio non trovato.</h2>
                    <p>Seleziona un viaggio dal menu.</p>
                </div>
            </div>
        );
    }

    const openNewExpenseForm = (prefill: Partial<Omit<Expense, 'id'>> = {}) => {
        setEditingExpense({
            id: '', // Indicates new
            amount: prefill.amount || 0,
            currency: prefill.currency || activeTrip.mainCurrency,
            category: prefill.category || '',
            description: prefill.description || '',
            date: prefill.date || new Date().toISOString(),
        });
        setIsExpenseFormOpen(true);
    };

    const openEditExpenseForm = (expense: Expense) => {
        setEditingExpense(expense);
        setIsExpenseFormOpen(true);
    };

    const closeExpenseForm = () => {
        setIsExpenseFormOpen(false);
        setEditingExpense(undefined);
    };

    const remainingBudgetPercentage = activeTrip.totalBudget > 0 ? (stats.remaining / activeTrip.totalBudget) * 100 : 0;
    let progressBarColor = 'bg-primary';
    if (remainingBudgetPercentage < 25) progressBarColor = 'bg-tertiary';
    if (remainingBudgetPercentage <= 0) progressBarColor = 'bg-error';

    const FilterButton: React.FC<{label: string, value: string, current: string, setter: (v:string) => void}> = ({label, value, current, setter}) => (
         <button 
            onClick={() => setter(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${current === value ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-variant text-on-surface-variant hover:bg-primary-container'}`}
        >
            {label}
        </button>
    );

    const CategoryFilterButton: React.FC<{label: string}> = ({ label }) => {
        const isSelected = selectedCategories.includes(label);
        return (
            <button
                onClick={() => handleCategoryToggle(label)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border ${isSelected ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-variant'}`}
            >
                {label}
            </button>
        );
    }

    const handleDaySelect = (date: string | null) => {
        setSelectedDayForDetail(date);
    };

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onToggleSidebar} className="p-2 rounded-full text-on-background hover:bg-surface-variant lg:hidden" aria-label="Apri menu">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-on-background">{activeTrip.name}</h1>
                        <p className="text-on-surface-variant">{new Date(activeTrip.startDate).toLocaleString()} - {new Date(activeTrip.endDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <button onClick={() => openNewExpenseForm()} className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    <span>Nuova Spesa</span>
                </button>
            </header>

            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-on-surface-variant">Budget Rimanente</span>
                    <span className="font-bold text-on-surface">{formatCurrency(stats.remaining, activeTrip.mainCurrency)}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-3">
                    <div className={`${progressBarColor} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(remainingBudgetPercentage, 100))}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1 text-on-surface-variant">
                    <span>Speso: {formatCurrency(stats.totalSpent, activeTrip.mainCurrency)}</span>
                    <span>Totale: {formatCurrency(stats.budget, activeTrip.mainCurrency)}</span>
                </div>
            </div>

            <div className="border-b border-surface-variant mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'summary'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
                        }`}
                        aria-current={activeTab === 'summary' ? 'page' : undefined}
                    >
                        Riepilogo
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'stats'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
                        }`}
                        aria-current={activeTab === 'stats' ? 'page' : undefined}
                    >
                        Statistiche
                    </button>
                </nav>
            </div>

            {activeTab === 'summary' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard title="Budget Totale" value={formatCurrency(stats.budget, activeTrip.mainCurrency)} color="bg-primary-container text-on-primary-container" icon="account_balance_wallet" />
                        <StatCard title="Spesa Totale" value={formatCurrency(stats.totalSpent, activeTrip.mainCurrency)} color="bg-tertiary-container text-on-tertiary-container" icon="shopping_cart" />
                        <StatCard title="Media Giornaliera" value={formatCurrency(stats.dailyAvg, activeTrip.mainCurrency)} color="bg-secondary-container text-on-secondary-container" icon="today" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <QuickExpense trip={activeTrip} />
                            {activeTrip.frequentExpenses && activeTrip.frequentExpenses.length > 0 &&
                                <FrequentExpenses 
                                    frequentExpenses={activeTrip.frequentExpenses} 
                                    onFrequentExpenseClick={openNewExpenseForm}
                                />
                            }
                            <ExpenseList expenses={sortedExpenses} trip={activeTrip} onEditExpense={openEditExpenseForm} />
                        </div>

                        <div className="space-y-6">
                            <CurrencyConverter trip={activeTrip} />
                        </div>
                    </div>
                 </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6">
                    <div className="bg-surface p-4 rounded-3xl shadow-sm">
                        <h3 className="text-lg font-semibold text-on-surface mb-3">Filtri</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-on-surface-variant mb-2">Periodo</p>
                                <div className="flex flex-wrap gap-2">
                                    <FilterButton label="Tutto" value="all" current={dateFilter} setter={setDateFilter} />
                                    <FilterButton label="Oggi" value="today" current={dateFilter} setter={setDateFilter} />
                                    <FilterButton label="Questa Settimana" value="week" current={dateFilter} setter={setDateFilter} />
                                    <FilterButton label="Questo Mese" value="month" current={dateFilter} setter={setDateFilter} />
                                </div>
                            </div>
                             {uniqueCategoriesInTrip.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-on-surface-variant">Categorie</p>
                                        {selectedCategories.length > 0 && (
                                            <button onClick={() => setSelectedCategories([])} className="text-sm text-primary font-medium hover:underline">
                                                Azzera
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueCategoriesInTrip.map(category => <CategoryFilterButton key={category} label={category} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {filteredExpenses.length === 0 && sortedExpenses.length > 0 ? (
                         <div className="text-center py-8 px-6 bg-surface-variant rounded-3xl shadow-sm">
                            <h2 className="text-xl font-semibold text-on-surface-variant">Nessuna spesa trovata</h2>
                            <p className="mt-1 text-on-surface-variant">Prova a modificare i filtri per visualizzare i dati.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AIInsights expenses={filteredExpenses} trip={activeTrip} />
                            <AIForecast expenses={filteredExpenses} trip={activeTrip} />
                            <AdvancedBudgetChart expenses={filteredExpenses} trip={activeTrip} onDaySelect={handleDaySelect} selectedDate={selectedDayForDetail} />
                            
                            {selectedDayForDetail && (
                                <div className="bg-surface p-6 rounded-3xl shadow-sm -mt-1 animate-[fade-in_0.3s_ease-out]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-on-surface">
                                            Dettaglio del {new Date(selectedDayForDetail).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button onClick={() => setSelectedDayForDetail(null)} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant" aria-label="Chiudi dettaglio">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    {expensesForSelectedDay.length > 0 ? (
                                        <ul className="divide-y divide-surface-variant max-h-60 overflow-y-auto pr-2">
                                            {expensesForSelectedDay.map(exp => (
                                                <li key={exp.id} className="flex items-center justify-between py-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 flex-shrink-0 bg-secondary-container text-on-secondary-container text-lg rounded-full flex items-center justify-center">
                                                            {getCategoryIcon(exp.category)}
                                                        </div>
                                                        <p className="font-medium text-on-surface truncate">{exp.description}</p>
                                                    </div>
                                                    <p className="font-semibold text-on-surface text-right flex-shrink-0 ml-2">{formatCurrency(exp.amount, exp.currency)}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-on-surface-variant py-4">Nessuna spesa registrata per questo giorno con i filtri attuali.</p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <StatsSummary expenses={filteredExpenses} trip={activeTrip} />
                                <CategoryChart expenses={filteredExpenses} trip={activeTrip} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                               <CountrySpendChart expenses={filteredExpenses} trip={activeTrip} />
                               <ExpenseTreemap expenses={filteredExpenses} trip={activeTrip} />
                            </div>

                             <ExpenseCalendarHeatmap expenses={filteredExpenses} trip={activeTrip} />
                           
                            {activeTrip.enableCategoryBudgets && (
                                <CategoryBudgetTracker trip={activeTrip} expenses={filteredExpenses} />
                            )}
                        </div>
                    )}
                </div>
            )}

            {isExpenseFormOpen && (
                <ExpenseForm 
                    trip={activeTrip} 
                    expense={editingExpense} 
                    onClose={closeExpenseForm} 
                />
            )}
        </div>
    );
};

export default Dashboard;