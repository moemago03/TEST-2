import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import TripForm from './TripForm';
import { Trip } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

interface TripSelectorProps {
    onSelectTrip: (tripId: string) => void;
    onToggleSidebar: () => void;
}

const TripCard: React.FC<{ trip: Trip; onSelect: () => void; onDelete: () => void; onEdit: () => void; }> = ({ trip, onSelect, onDelete, onEdit }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    
    const stats = useMemo(() => {
        const totalSpent = trip.expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        const budget = trip.totalBudget;
        const progress = budget > 0 ? (totalSpent / budget) * 100 : 0;
        return { totalSpent, budget, progress };
    }, [trip, convert]);

    const days = Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
    
    return (
        <div className="bg-surface-variant rounded-3xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col overflow-hidden group">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-on-surface-variant">{trip.name}</h3>
                        <p className="text-sm text-on-surface-variant">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()} ({days} giorni)</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={onEdit} className="text-on-surface-variant hover:bg-primary-container p-2 rounded-full" aria-label="Modifica viaggio">
                            <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-on-surface-variant hover:bg-error-container p-2 rounded-full" aria-label="Elimina viaggio">
                           <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-on-surface-variant">
                        <span className="font-medium">Speso</span>
                        <span className="font-semibold text-on-surface">{formatCurrency(stats.totalSpent, trip.mainCurrency)}</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 mt-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(stats.progress, 100)}%` }}></div>
                    </div>
                    <div className="text-right text-sm text-on-surface-variant mt-1">
                        Budget: {formatCurrency(stats.budget, trip.mainCurrency)}
                    </div>
                </div>
            </div>
            <div className="mt-auto p-4 bg-surface-variant/50 flex justify-end">
                 <button onClick={onSelect} className="px-6 py-2.5 bg-primary text-on-primary font-medium text-sm rounded-full shadow-sm hover:shadow-md transition-all">
                    Apri Dashboard
                </button>
            </div>
        </div>
    );
};

const TripSelector: React.FC<TripSelectorProps> = ({ onSelectTrip, onToggleSidebar }) => {
    const { data, loading, deleteTrip } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

    const handleDelete = (tripId: string) => {
        if(window.confirm("Sei sicuro di voler eliminare questo viaggio e tutte le sue spese?")) {
            deleteTrip(tripId);
        }
    };
    
    const openNewTripForm = () => {
        setEditingTrip(null);
        setIsFormOpen(true);
    };

    const openEditTripForm = (trip: Trip) => {
        setEditingTrip(trip);
        setIsFormOpen(true);
    };

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                    <button onClick={onToggleSidebar} className="p-2 rounded-full text-on-background hover:bg-surface-variant lg:hidden" aria-label="Apri menu">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <h1 className="text-3xl font-bold text-on-background">I Miei Viaggi</h1>
                </div>
                 <button onClick={openNewTripForm} className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    <span className="hidden sm:inline">Nuovo Viaggio</span>
                    <span className="sm:hidden">Nuovo</span>
                </button>
            </header>
            
            {loading ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold text-on-surface-variant">Caricamento in corso...</h2>
                    <p className="mt-2 text-on-surface-variant">Recupero dei dati dei tuoi viaggi.</p>
                </div>
            ) : data && data.trips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {data.trips.map(trip => (
                        <TripCard 
                            key={trip.id} 
                            trip={trip} 
                            onSelect={() => onSelectTrip(trip.id)} 
                            onDelete={() => handleDelete(trip.id)}
                            onEdit={() => openEditTripForm(trip)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-surface-variant rounded-3xl shadow-sm">
                    <h2 className="text-2xl font-semibold text-on-surface-variant">Nessun viaggio ancora!</h2>
                    <p className="mt-2 text-on-surface-variant">Inizia creando il tuo primo viaggio per tracciare le spese.</p>
                </div>
            )}

            {isFormOpen && (
                <TripForm 
                  trip={editingTrip || undefined}
                  onClose={() => setIsFormOpen(false)} 
                />
            )}
        </div>
    );
};

export default TripSelector;
