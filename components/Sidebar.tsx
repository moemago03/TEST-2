import React, { useState } from 'react';
import { Trip } from '../types';
import CategoryManager from './CategoryManager';
import FrequentExpenseManager from './FrequentExpenseManager';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
    trips: Trip[];
    activeTrip: Trip | null;
    onSelectTrip: (tripId: string) => void;
    onDeselectTrip: () => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const NavItem: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
    isActive?: boolean;
}> = ({ icon, label, onClick, isActive }) => {
    return (
        <li>
            <button
                onClick={onClick}
                className={`w-full h-14 text-left flex items-center gap-3 px-3 rounded-full transition-colors truncate ${
                    isActive
                        ? 'bg-secondary-container text-on-secondary-container font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-variant'
                }`}
            >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
            </button>
        </li>
    )
}

const Sidebar: React.FC<SidebarProps> = ({ trips, activeTrip, onSelectTrip, onDeselectTrip, onLogout, isOpen, onClose }) => {
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [isFrequentExpenseManagerOpen, setIsFrequentExpenseManagerOpen] = useState(false);

    const handleDeselectTrip = () => {
        onDeselectTrip();
        onClose();
    };
    
    const handleManageCategories = () => {
        setIsCategoryManagerOpen(true);
        onClose();
    };

    const handleManageFrequentExpenses = () => {
        setIsFrequentExpenseManagerOpen(true);
        onClose();
    };


    return (
        <>
            <div 
                onClick={onClose} 
                className={`fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-hidden="true"
            />
            
            <aside className={`fixed top-0 left-0 h-full w-64 bg-surface shadow-xl flex-shrink-0 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="h-16 flex items-center px-4">
                    <h1 className="text-xl font-bold text-on-surface">Viaggio Sotto Controllo</h1>
                </div>

                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <ul className="space-y-1">
                        <NavItem icon="space_dashboard" label="Dashboard Principale" onClick={handleDeselectTrip} isActive={!activeTrip} />
                    </ul>
                    
                    <div className="pt-2">
                        <h3 className="px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">I Tuoi Viaggi</h3>
                        <ul className="mt-1 space-y-1">
                            {trips.map(trip => (
                                <NavItem 
                                    key={trip.id}
                                    icon="luggage" 
                                    label={trip.name} 
                                    onClick={() => { onSelectTrip(trip.id); onClose(); }} 
                                    isActive={activeTrip?.id === trip.id} 
                                />
                            ))}
                        </ul>
                    </div>

                     <div className="pt-2">
                        <h3 className="px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Impostazioni</h3>
                         <ul className="mt-1 space-y-1">
                             <NavItem icon="category" label="Gestisci Categorie" onClick={handleManageCategories} />
                             {activeTrip && (
                                <NavItem icon="add_circle" label="Spese Frequenti" onClick={handleManageFrequentExpenses} />
                             )}
                             <li>
                                 <ThemeToggle />
                             </li>
                         </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-surface-variant mt-auto">
                     <button
                        onClick={onLogout}
                        className="w-full h-14 text-left flex items-center gap-3 px-3 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </aside>
            {isCategoryManagerOpen && (
                <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
            )}
            {isFrequentExpenseManagerOpen && activeTrip && (
                <FrequentExpenseManager 
                    activeTrip={activeTrip}
                    onClose={() => setIsFrequentExpenseManagerOpen(false)} 
                />
            )}
        </>
    );
};

export default Sidebar;