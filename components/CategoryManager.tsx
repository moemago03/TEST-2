import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface CategoryManagerProps {
    onClose: () => void;
}

const SUGGESTED_ICONS_BY_CATEGORY = {
  'Viaggi e Trasporti': ['✈️', '🚆', '🚕', '⛽', '🗺️', '🏨', '🚢', '🚌'],
  'Cibo e Bevande': ['🍽️', '🍔', '🍕', '☕', '🍺', '🍷', '🛒', '🍸'],
  'Attività e Shopping': ['🎭', '🎟️', '📸', '🏛️', '🛍️', '🎁', '👘', '🖼️'],
  'Salute e Varie': ['💊', '⚕️', '💳', '🧾', '🛄', '🧺', '🆘', '📶'],
};

const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
    const { data, addCategory, updateCategory, deleteCategory } = useData();
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const isDefault = (categoryId: string) => DEFAULT_CATEGORIES.some(c => c.id === categoryId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !icon.trim()) {
            alert("Nome e icona sono obbligatori.");
            return;
        }

        if (editingCategory) {
            updateCategory({ ...editingCategory, name, icon });
        } else {
            addCategory({ name, icon });
        }
        resetForm();
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setIcon(category.icon);
        document.getElementById('category-name-input')?.focus();
    };

    const handleDelete = (categoryId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa categoria? Tutte le spese associate verranno spostate in 'Varie'.")) {
            deleteCategory(categoryId);
        }
    };

    const resetForm = () => {
        setName('');
        setIcon('');
        setEditingCategory(null);
    };

    const customCategories = data.categories.filter(c => !isDefault(c.id));
    const inputClasses = "block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-surface p-6 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="category-manager-title">
                <div className="flex justify-between items-center mb-4">
                    <h2 id="category-manager-title" className="text-2xl font-bold text-on-surface">Gestisci Categorie</h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full -mr-2" aria-label="Chiudi"><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="overflow-y-auto pr-2">
                    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-surface-variant rounded-2xl bg-surface-variant/50 space-y-4">
                        <h3 className="font-semibold text-lg text-on-surface">{editingCategory ? 'Modifica Categoria' : 'Aggiungi Categoria'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label htmlFor="category-name-input" className={labelClasses}>Nome</label>
                                <input id="category-name-input" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Es. Souvenir" className={`mt-1 ${inputClasses}`}/>
                            </div>
                            <div>
                                <label htmlFor="category-icon-input" className={labelClasses}>Icona</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input id="category-icon-input" type="text" value={icon} onChange={e => setIcon(e.target.value)} required placeholder="🎁" maxLength={2} className={`${inputClasses} w-16 text-center text-2xl`}/>
                                    <div className="w-12 h-12 flex items-center justify-center bg-surface border border-outline rounded-lg" aria-hidden="true">
                                        <span className="text-3xl">{icon || '❔'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <label className={labelClasses}>Suggerimenti Icona</label>
                            {Object.entries(SUGGESTED_ICONS_BY_CATEGORY).map(([category, icons]) => (
                                <div key={category}>
                                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{category}</h4>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {icons.map(suggestedIcon => (
                                            <button type="button" key={suggestedIcon} onClick={() => setIcon(suggestedIcon)} className="p-2 w-12 h-12 text-2xl rounded-lg bg-surface border border-outline hover:bg-secondary-container focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-colors" aria-label={`Seleziona icona ${suggestedIcon}`}>{suggestedIcon}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {editingCategory && <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-primary rounded-full hover:bg-primary-container">Annulla</button>}
                            <button type="submit" className="px-6 py-2.5 text-sm font-medium bg-primary text-on-primary rounded-full shadow-sm hover:shadow-md">{editingCategory ? 'Salva Modifiche' : 'Aggiungi'}</button>
                        </div>
                    </form>

                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-on-surface">Categorie Personalizzate</h3>
                        {customCategories.length > 0 ? (
                            <ul className="space-y-1">
                                {customCategories.map(cat => (
                                    <li key={cat.id} className="p-2 rounded-lg hover:bg-surface-variant flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3" aria-hidden="true">{cat.icon}</span>
                                            <span className="font-medium text-on-surface">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(cat)} className="text-sm text-primary hover:underline">Modifica</button>
                                            <button onClick={() => handleDelete(cat.id)} className="text-sm text-error hover:underline">Elimina</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-on-surface-variant text-center py-4">Non hai ancora categorie personalizzate.</p>
                        )}
                        
                        <h3 className="font-semibold text-lg mt-6 mb-2 text-on-surface">Categorie Predefinite</h3>
                        <ul className="space-y-1">
                            {DEFAULT_CATEGORIES.map(cat => (
                                <li key={cat.id} className="p-2 flex items-center">
                                    <span className="text-2xl mr-3" aria-hidden="true">{cat.icon}</span>
                                    <span className="font-medium text-on-surface-variant">{cat.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
