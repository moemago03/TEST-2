import React, { useState } from 'react';
import { Trip } from '../types';
import { useData } from '../context/DataContext';
import { CURRENCY_TO_COUNTRY } from '../constants';

interface QuickExpenseProps {
    trip: Trip;
}

const QuickExpense: React.FC<QuickExpenseProps> = ({ trip }) => {
    const { addExpense, data } = useData();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddExpense = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setError(null);

        try {
            // Dynamically import the module only when needed to prevent load-time errors
            const { GoogleGenAI, Type } = await import('@google/genai');
            
            // FIX: Initialize GoogleGenAI directly with process.env.API_KEY as per guidelines.
            // The API key is assumed to be available in the environment.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const availableCategories = data.categories.map(c => c.name);

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `From the text "${prompt}", extract the expense details. Use today's date. The currency must be one of these: ${trip.preferredCurrencies.join(', ')}. The category must be one of these: ${availableCategories.join(', ')}. If no currency is specified, assume ${trip.mainCurrency}.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER, description: "The numeric amount of the expense." },
                            currency: { type: Type.STRING, description: `The currency code (e.g., EUR, USD). Must be one of ${trip.preferredCurrencies.join(', ')}.` },
                            description: { type: Type.STRING, description: "A brief description of the expense." },
                            category: { type: Type.STRING, description: `The category of the expense. Must be one of ${availableCategories.join(', ')}.` }
                        },
                        required: ["amount", "currency", "description", "category"]
                    }
                }
            });

            let jsonString = response.text.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const expenseData = JSON.parse(jsonString);

            if (expenseData.amount > 0 && expenseData.description && expenseData.category && expenseData.currency) {
                 if (!trip.preferredCurrencies.includes(expenseData.currency.toUpperCase())) {
                    throw new Error(`Valuta "${expenseData.currency}" non valida per questo viaggio. Valute ammesse: ${trip.preferredCurrencies.join(', ')}.`);
                }
                if (!availableCategories.includes(expenseData.category)) {
                     throw new Error(`Categoria "${expenseData.category}" non valida.`);
                }
                
                addExpense(trip.id, {
                    ...expenseData,
                    date: new Date().toISOString(),
                    country: CURRENCY_TO_COUNTRY[expenseData.currency.toUpperCase()]
                });
                setPrompt(''); // Clear input on success
            } else {
                throw new Error("Dati della spesa incompleti o non validi restituiti dall'AI.");
            }
        } catch (e: any) {
            console.error("Error processing quick expense:", e);
            setError(`Impossibile aggiungere la spesa. ${e.message || 'Riprova o usa il modulo completo.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-3">Spesa Rapida (con AI)</h2>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                    disabled={isLoading}
                    className="flex-grow bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-variant/50"
                    placeholder="Es: 15.50 EUR pranzo"
                />
                <button
                    onClick={handleAddExpense}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-full shadow-sm hover:shadow-md transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <span className="material-symbols-outlined">add</span>
                    )}
                    <span>Aggiungi</span>
                </button>
            </div>
            {error && <p className="text-error text-sm mt-2">{error}</p>}
        </div>
    );
};

export default QuickExpense;