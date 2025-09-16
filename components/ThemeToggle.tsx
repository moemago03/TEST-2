import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full h-14 text-left flex items-center gap-3 px-3 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
            aria-label={`Passa al tema ${theme === 'light' ? 'scuro' : 'chiaro'}`}
        >
            {theme === 'light' ? (
                <span className="material-symbols-outlined">dark_mode</span>
            ) : (
                <span className="material-symbols-outlined">light_mode</span>
            )}
            <span className="text-sm font-medium">
                Tema {theme === 'light' ? 'Scuro' : 'Chiaro'}
            </span>
        </button>
    );
};

export default ThemeToggle;
