import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Move } from 'lucide-react';
import clsx from 'clsx';
import useSchemaStore from '../store/useSchemaStore';
import { CARD_COLORS, getCardColor } from '../utils/theme';

const TableEditor = ({ tableId, onClose }) => {
    const { nodes, updateTable, removeTable } = useSchemaStore();
    const tableNode = nodes.find(n => n.id === tableId);

    const [name, setName] = useState('');
    const [columns, setColumns] = useState([]);
    const [color, setColor] = useState('White');
    const darkMode = useSchemaStore((state) => state.visualizationSettings.darkMode);

    useEffect(() => {
        if (tableNode) {
            setName(tableNode.data.name);
            setColumns(JSON.parse(JSON.stringify(tableNode.data.columns))); // Deep copy
            setColor(tableNode.data.color || 'White');
        }
    }, [tableNode, tableId]);

    if (!tableNode) return null;

    const handleSave = () => {
        updateTable(tableId, { name, columns, color });
        onClose();
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete table "${name}"?`)) {
            removeTable(tableId);
            onClose();
        }
    };

    const addColumn = () => {
        setColumns([...columns, {
            name: 'new_column',
            type: 'VARCHAR(255)',
            pk: false,
            fk: false,
            nullable: true
        }]);
    };

    const updateColumn = (index, field, value) => {
        const newCols = [...columns];
        newCols[index] = { ...newCols[index], [field]: value };
        setColumns(newCols);
    };

    const removeColumn = (index) => {
        setColumns(columns.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Move size={18} /> Edit Table: {tableNode.data.name}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {/* Table Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Table Name</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Table Color */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(CARD_COLORS).map(([key, theme]) => {
                                const activeVal = darkMode ? theme.dark : theme.light;
                                return (
                                    <button
                                        key={key}
                                        className={`w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 ${color === key ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                        style={{ backgroundColor: activeVal }}
                                        onClick={() => setColor(key)}
                                        title={key}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Columns */}
                    <div className="mb-2 flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Columns</label>
                        <button onClick={addColumn} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 font-medium">
                            <Plus size={14} /> Add Column
                        </button>
                    </div>

                    <div className="space-y-2">
                        {columns.map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-slate-700 rounded bg-gray-50 dark:bg-slate-800 group">
                                <input
                                    type="text"
                                    value={col.name}
                                    onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                                    className="flex-1 min-w-[120px] text-sm border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 outline-none focus:border-blue-400 border"
                                    placeholder="Name"
                                />
                                <select
                                    value={col.type}
                                    onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                                    className="w-[120px] text-sm border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 outline-none focus:border-blue-400 border"
                                >
                                    <option value="INT">INT</option>
                                    <option value="VARCHAR(255)">VARCHAR</option>
                                    <option value="TEXT">TEXT</option>
                                    <option value="BOOLEAN">BOOLEAN</option>
                                    <option value="TIMESTAMP">TIMESTAMP</option>
                                    <option value="DATE">DATE</option>
                                    <option value="UUID">UUID</option>
                                </select>

                                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded px-2 py-1">
                                    <label className={clsx("text-xs cursor-pointer select-none font-bold px-1 rounded", col.pk ? "bg-yellow-100 text-yellow-700" : "text-gray-400")}>
                                        <input type="checkbox" className="hidden" checked={col.pk} onChange={(e) => updateColumn(idx, 'pk', e.target.checked)} />
                                        PK
                                    </label>
                                    <div className="w-[1px] h-3 bg-gray-300 dark:bg-slate-500"></div>
                                    <label className={clsx("text-xs cursor-pointer select-none font-bold px-1 rounded", col.fk ? "bg-blue-100 text-blue-700" : "text-gray-400")}>
                                        <input type="checkbox" className="hidden" checked={col.fk} onChange={(e) => updateColumn(idx, 'fk', e.target.checked)} />
                                        FK
                                    </label>
                                    <div className="w-[1px] h-3 bg-gray-300 dark:bg-slate-500"></div>
                                    <label className={clsx("text-xs cursor-pointer select-none font-bold px-1 rounded", col.nullable ? "bg-green-100 text-green-700" : "text-gray-400")}>
                                        <input type="checkbox" className="hidden" checked={col.nullable} onChange={(e) => updateColumn(idx, 'nullable', e.target.checked)} />
                                        NULL
                                    </label>
                                </div>

                                <button onClick={() => removeColumn(idx)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-between rounded-b-xl">
                    <button onClick={handleDelete} className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 flex items-center gap-2 font-medium">
                        <Trash2 size={16} /> Delete Table
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded font-medium">Cancel</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 font-medium">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableEditor;
