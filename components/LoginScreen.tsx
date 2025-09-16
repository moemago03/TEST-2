import React, { useState } from 'react';

interface LoginScreenProps {
    onLogin: (password: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onLogin(password.trim());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-variant">
            <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-3xl shadow-lg m-4">
                 <div className="text-center">
                    <h1 className="text-4xl font-bold text-on-surface">Viaggio Sotto Controllo</h1>
                    <div className="flex justify-center items-center gap-8 mt-8 text-on-surface-variant text-4xl">
                        <span className="material-symbols-outlined" title="Gestisci Viaggi">luggage</span>
                        <span className="material-symbols-outlined" title="Traccia Spese">receipt_long</span>
                        <span className="material-symbols-outlined" title="Controlla Budget">account_balance_wallet</span>
                        <span className="material-symbols-outlined" title="Converti Valuta">currency_exchange</span>
                    </div>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                        <label 
                            htmlFor="password-input" 
                            className="absolute -top-2.5 left-3 text-xs text-on-surface-variant bg-surface px-1"
                        >
                            Password
                        </label>
                        <input
                            id="password-input"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-3 bg-transparent border border-outline rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Inserisci o crea una password"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-full text-on-primary bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 shadow-md"
                        >
                            Accedi o Registrati
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;