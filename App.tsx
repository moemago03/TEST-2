


import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginScreen from './components/LoginScreen';
import TripSelector from './components/TripSelector';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { Trip } from './types';

const AppContent: React.FC<{
    onLogout: () => void;
}> = ({ onLogout }) => {
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { data, loading } = useData();

    useEffect(() => {
        if (data) {
            const lastActiveTrip = localStorage.getItem('vsc_activeTripId');
            if(lastActiveTrip && data.trips.some(t => t.id === lastActiveTrip)) {
                setActiveTripId(lastActiveTrip);
            } else {
                 localStorage.removeItem('vsc_activeTripId');
                 setActiveTripId(null);
            }
        }
    }, [data]);

    const selectTrip = (tripId: string) => {
        localStorage.setItem('vsc_activeTripId', tripId);
        setActiveTripId(tripId);
        setIsSidebarOpen(false);
    };

    const deselectTrip = () => {
        localStorage.removeItem('vsc_activeTripId');
        setActiveTripId(null);
        setIsSidebarOpen(false);
    };
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-on-background">Caricamento dati...</h2>
                    <p className="mt-2 text-on-surface-variant">Un attimo di pazienza mentre recuperiamo i tuoi viaggi.</p>
                </div>
            </div>
        );
    }
    
    const activeTrip = data.trips.find(t => t.id === activeTripId) || null;

    return (
        <div className="min-h-screen bg-background text-on-background font-sans">
            <Sidebar
                trips={data.trips}
                activeTrip={activeTrip}
                onSelectTrip={selectTrip}
                onDeselectTrip={deselectTrip}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 flex flex-col overflow-y-auto lg:pl-64">
                {activeTripId ? (
                    <Dashboard 
                        key={activeTripId}
                        activeTripId={activeTripId}
                        onToggleSidebar={toggleSidebar}
                    />
                ) : (
                    <TripSelector onSelectTrip={selectTrip} onToggleSidebar={toggleSidebar} />
                )}
            </main>
        </div>
    );
};


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const loggedInUser = localStorage.getItem('vsc_user');
        if (loggedInUser) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (password: string) => {
        localStorage.setItem('vsc_user', password);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('vsc_user');
        localStorage.removeItem('vsc_activeTripId');
        setIsAuthenticated(false);
    };
    
    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <ThemeProvider>
            <CurrencyProvider>
                <DataProvider>
                    <AppContent onLogout={handleLogout} />
                </DataProvider>
            </CurrencyProvider>
        </ThemeProvider>
    );
};

export default App;