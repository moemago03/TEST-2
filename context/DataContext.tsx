import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { UserData, Trip, Expense, Category, CategoryBudget } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { fetchData, saveData as saveCloudData } from '../services/googleSheetService';

interface DataContextProps {
    data: UserData | null;
    loading: boolean;
    addTrip: (trip: Omit<Trip, 'id' | 'expenses'>) => void;
    updateTrip: (trip: Trip) => void;
    deleteTrip: (tripId: string) => void;
    addExpense: (tripId: string, expense: Omit<Expense, 'id'>) => void;
    updateExpense: (tripId: string, expense: Expense) => void;
    deleteExpense: (tripId: string, expenseId: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (categoryId: string) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

const defaultUserData: UserData = { trips: [], categories: DEFAULT_CATEGORIES };

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const user = localStorage.getItem('vsc_user');
            if (!user) {
                setLoading(false);
                // This state should not be reachable if app flow is correct
                return; 
            }
            try {
                let fetchedData = await fetchData(user);

                if (!fetchedData) { // If user is new, API returns null
                    fetchedData = defaultUserData;
                } else {
                    // Ensure default categories are always present if missing from fetched data
                    if (!fetchedData.categories || fetchedData.categories.length === 0) {
                        fetchedData.categories = DEFAULT_CATEGORIES;
                    }
                    const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
                    const missingDefaults = DEFAULT_CATEGORIES.filter(dc => !fetchedData.categories.some(uc => uc.id === dc.id));
                    if(missingDefaults.length > 0) {
                        const customCategories = fetchedData.categories.filter(c => !defaultIds.has(c.id));
                        fetchedData.categories = [...DEFAULT_CATEGORIES, ...customCategories];
                    }
                }
                
                setData(fetchedData);
            } catch (error) {
                console.error("Failed to load initial data", error);
                setData(defaultUserData); // Fallback to default data on error
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const saveData = useCallback((newData: UserData) => {
        const user = localStorage.getItem('vsc_user');
        if (user) {
            setData(newData); // Optimistic update
            saveCloudData(user, newData); // Save to cloud in the background
        }
    }, []);

    const addTrip = (trip: Omit<Trip, 'id' | 'expenses'>) => {
        if (!data) return;
        const newTrip: Trip = { 
            ...trip, 
            id: Date.now().toString(), 
            expenses: [], 
            frequentExpenses: trip.frequentExpenses || [],
            enableCategoryBudgets: trip.enableCategoryBudgets || false,
            categoryBudgets: trip.categoryBudgets || []
        };
        const newData = { ...data, trips: [...data.trips, newTrip] };
        saveData(newData);
    };

    const updateTrip = (updatedTrip: Trip) => {
        if (!data) return;
        const updatedTrips = data.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    };

    const deleteTrip = (tripId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.filter(t => t.id !== tripId);
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
        if (localStorage.getItem('vsc_activeTripId') === tripId) {
            localStorage.removeItem('vsc_activeTripId');
        }
    };
    
    const addExpense = (tripId: string, expense: Omit<Expense, 'id'>) => {
        if (!data) return;
        const newExpense: Expense = { ...expense, id: Date.now().toString() };
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                return { ...trip, expenses: [...trip.expenses, newExpense] };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    };

    const updateExpense = (tripId: string, updatedExpense: Expense) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedExpenses = trip.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
                return { ...trip, expenses: updatedExpenses };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    };

    const deleteExpense = (tripId: string, expenseId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedExpenses = trip.expenses.filter(e => e.id !== expenseId);
                return { ...trip, expenses: updatedExpenses };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    };

    const addCategory = (category: Omit<Category, 'id'>) => {
        if (!data) return;
        const newCategory: Category = { ...category, id: `custom-cat-${Date.now().toString()}` };
        const newData = { ...data, categories: [...data.categories, newCategory] };
        saveData(newData);
    };

    const updateCategory = (updatedCategory: Category) => {
        if (!data) return;
        const oldCategory = data.categories.find(c => c.id === updatedCategory.id);
        const updatedCategories = data.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
        
        let updatedTrips = data.trips;
        if(oldCategory && oldCategory.name !== updatedCategory.name) {
            updatedTrips = data.trips.map(trip => ({
                ...trip,
                expenses: trip.expenses.map(exp => exp.category === oldCategory.name ? { ...exp, category: updatedCategory.name } : exp)
            }));
        }

        const newData = { ...data, trips: updatedTrips, categories: updatedCategories };
        saveData(newData);
    };

    const deleteCategory = (categoryId: string) => {
        if (!data) return;
        if (DEFAULT_CATEGORIES.some(c => c.id === categoryId)) {
            alert("Le categorie predefinite non possono essere eliminate.");
            return;
        }

        const categoryToDelete = data.categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        const miscellaneousCategory = data.categories.find(c => c.id === 'cat-8');
        if (!miscellaneousCategory) {
            alert("Impossibile trovare la categoria 'Varie' per riassegnare le spese.");
            return;
        }
        
        const updatedTrips = data.trips.map(trip => {
            const needsUpdate = trip.expenses.some(e => e.category === categoryToDelete.name);
            if (!needsUpdate) return trip;
            
            return {
                ...trip,
                expenses: trip.expenses.map(expense => {
                    if (expense.category === categoryToDelete.name) {
                        return { ...expense, category: miscellaneousCategory.name };
                    }
                    return expense;
                })
            };
        });

        const updatedCategories = data.categories.filter(c => c.id !== categoryId);
        const newData = { ...data, trips: updatedTrips, categories: updatedCategories };
        saveData(newData);
    };

    const value = {
        data,
        loading,
        addTrip,
        updateTrip,
        deleteTrip,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        deleteCategory,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    if (!context.data && !context.loading) {
        // This can happen if there was a major fetch error. Provide a safe default.
        return { ...context, data: defaultUserData };
    }
    return context;
};