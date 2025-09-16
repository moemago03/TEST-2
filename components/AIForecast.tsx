import React, { useState, useMemo } from 'react';
import { Trip, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { GoogleGenAI, Type } from "@google/genai";

interface AIForecastProps {
    expenses: Expense[];
    trip: Trip;
}

interface AnalysisResult {
    forecast: string;
    anomalies: string[];
}

const AIForecast: React.FC<AIForecastProps> = ({ expenses, trip }) => {
    const { convert } = useCurrencyConverter();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analysisData = useMemo(() => {
        if (expenses.length < 3) return null;

        const totalSpent = expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);

        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
        const today = new Date();

        // Don't calculate if trip is over
        if (today > tripEnd) return null;

        const totalDays = Math.max(1, (tripEnd.getTime() - tripStart.getTime()) / (1000 * 3600 * 24) + 1);
        let daysElapsed = (today.getTime() - tripStart.getTime()) / (1000 * 3600 * 24) + 1;
        daysElapsed = Math.max(1, Math.ceil(daysElapsed));
        const daysRemaining = Math.max(0, totalDays - daysElapsed);
        
        const currentDailyAvg = totalSpent / daysElapsed;
        
        // Prepare recent expenses for anomaly detection
        const recentExpenses = expenses.slice(0, 15).map(e => ({
            description: e.description,
            category: e.category,
            amount: parseFloat(convert(e.amount, e.currency, trip.mainCurrency).toFixed(2))
        }));

        return {
            totalBudget: trip.totalBudget,
            mainCurrency: trip.mainCurrency,
            totalDays,
            daysElapsed,
            daysRemaining,
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            currentDailyAvg: parseFloat(currentDailyAvg.toFixed(2)),
            recentExpenses
        };
    }, [expenses, trip, convert]);

    const generateForecast = async () => {
        if (!analysisData) {
            setError("Non ci sono abbastanza dati o il viaggio è terminato.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Sei un assistente finanziario per viaggiatori. Analizza i seguenti dati di viaggio e fornisci una previsione di budget e rileva eventuali anomalie di spesa recenti. Rispondi in italiano. Dati: ${JSON.stringify(analysisData)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            forecast: {
                                type: Type.STRING,
                                description: "Una previsione di budget di una frase in italiano (es. 'Di questo passo, finirai il viaggio con un avanzo di X EUR.')."
                            },
                            anomalies: {
                                type: Type.ARRAY,
                                description: "Una lista di 1-2 stringhe che descrivono anomalie di spesa recenti. Se non ci sono anomalie, restituisci un array vuoto.",
                                items: {
                                    type: Type.STRING
                                }
                            }
                        },
                        required: ["forecast", "anomalies"]
                    }
                }
            });

            let jsonString = response.text.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const aiResult = JSON.parse(jsonString);

            if (aiResult.forecast) {
                setResult(aiResult);
            } else {
                throw new Error("L'AI non ha fornito una previsione valida.");
            }

        } catch (e: any) {
            console.error("Error generating AI forecast:", e);
            setError(`Analisi fallita. ${e.message || 'Riprova più tardi.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!analysisData && !isLoading) {
        // Don't show if trip is over or not enough data
        return null;
    }

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <h2 className="text-xl font-semibold text-on-surface">Previsioni e Anomalie (AI)</h2>
                <button
                    onClick={generateForecast}
                    disabled={isLoading}
                    className="px-4 py-2 bg-secondary-container text-on-secondary-container font-semibold rounded-full shadow-sm hover:shadow-md transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">insights</span>
                    <span>{isLoading ? 'Calcolando...' : 'Genera Previsione'}</span>
                </button>
            </div>

            <div className="min-h-[6rem] flex items-center justify-center">
                {isLoading && (
                    <div className="text-center text-on-surface-variant">
                        <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-sm">L'AI sta elaborando i tuoi dati...</p>
                    </div>
                )}
                {error && <p className="text-error text-center">{error}</p>}

                {!isLoading && !error && result && (
                    <div className="space-y-4 w-full">
                        <div className="flex items-start gap-3">
                           <span className="material-symbols-outlined text-secondary-container mt-1">show_chart</span>
                           <p className="font-medium text-on-surface">{result.forecast}</p>
                        </div>
                        {result.anomalies.length > 0 && (
                             <div className="space-y-2 p-3 bg-error-container/30 rounded-lg">
                                 {result.anomalies.map((anomaly, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-error mt-1">warning</span>
                                        <p className="text-on-error-container text-sm">{anomaly}</p>
                                    </div>
                                ))}
                             </div>
                        )}
                         {result.anomalies.length === 0 && (
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary-container mt-1">task_alt</span>
                                <p className="text-on-surface-variant">Nessuna anomalia di spesa significativa rilevata di recente. Ottimo lavoro!</p>
                            </div>
                         )}
                    </div>
                )}
                
                {!isLoading && !error && !result && (
                    <p className="text-on-surface-variant text-center">Clicca su "Genera Previsione" per ottenere un'analisi predittiva del tuo budget.</p>
                )}
            </div>
        </div>
    );
};

export default AIForecast;