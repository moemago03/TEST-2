import React, { useState, useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { GoogleGenAI, Type } from "@google/genai";

interface AIInsightsProps {
    expenses: Expense[];
    trip: Trip;
}

const AIInsights: React.FC<AIInsightsProps> = ({ expenses, trip }) => {
    const { convert } = useCurrencyConverter();
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const dataSummary = useMemo(() => {
        if (expenses.length < 3) return null; // Need some data to analyze

        const totalSpent = expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        
        const spendingByCategory = expenses.reduce((acc, exp) => {
            const amount = convert(exp.amount, exp.currency, trip.mainCurrency);
            acc[exp.category] = (acc[exp.category] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });
        
        const firstDate = new Date(expenses[expenses.length - 1].date);
        const lastDate = new Date(expenses[0].date);
        const durationDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) + 1;

        return {
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            numberOfExpenses: expenses.length,
            durationDays,
            spendingByCategory: Object.fromEntries(
                Object.entries(spendingByCategory).map(([key, value]) => [key, parseFloat(value.toFixed(2))])
            ),
        };
    }, [expenses, trip.mainCurrency, convert]);

    const generateInsights = async () => {
        if (!dataSummary) {
            setError("Non ci sono abbastanza dati per un'analisi significativa.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setInsights([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Analizza questo riepilogo di spese di viaggio e fornisci 3-4 spunti di riflessione brevi e utili in italiano. Concentrati su tendenze, spese anomale o abitudini interessanti. Sii conciso e amichevole. Riepilogo dati: ${JSON.stringify(dataSummary)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            insights: {
                                type: Type.ARRAY,
                                description: "Una lista di 3-4 spunti di riflessione testuali in italiano.",
                                items: {
                                    type: Type.STRING
                                }
                            }
                        },
                        required: ["insights"]
                    }
                }
            });
            
            let jsonString = response.text.trim();
             if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const result = JSON.parse(jsonString);

            if (result.insights && result.insights.length > 0) {
                setInsights(result.insights);
            } else {
                throw new Error("L'AI non ha fornito alcuna analisi.");
            }

        } catch (e: any) {
            console.error("Error generating AI insights:", e);
            setError(`Analisi fallita. ${e.message || 'Riprova più tardi.'}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (expenses.length < 3 && !isLoading) {
        return null; // Don't show the component if there isn't enough data
    }

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <h2 className="text-xl font-semibold text-on-surface">Analisi Intelligente con AI</h2>
                <button
                    onClick={generateInsights}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-container text-on-primary-container font-semibold rounded-full shadow-sm hover:shadow-md transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>{isLoading ? 'Analizzando...' : 'Genera Analisi'}</span>
                </button>
            </div>
            
            <div className="min-h-[6rem] flex items-center justify-center">
                {isLoading && (
                    <div className="text-center text-on-surface-variant">
                        <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-sm">L'AI sta analizzando le tue spese...</p>
                    </div>
                )}
                {error && <p className="text-error text-center">{error}</p>}

                {!isLoading && !error && insights.length > 0 && (
                    <ul className="space-y-2">
                        {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary-container mt-1">spark</span>
                                <p className="text-on-surface-variant">{insight}</p>
                            </li>
                        ))}
                    </ul>
                )}
                
                {!isLoading && !error && insights.length === 0 && (
                    <p className="text-on-surface-variant text-center">Clicca su "Genera Analisi" per ricevere spunti personalizzati sulle tue spese.</p>
                )}
            </div>
        </div>
    );
};

export default AIInsights;