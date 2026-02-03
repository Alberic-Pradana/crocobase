import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    addEdge,
    ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import useSchemaStore from '../store/useSchemaStore';
import TableNode from './TableNode';
import TableEditor from './TableEditor';
import { Download, Upload, Plus, Trash2, Settings, Moon, Sun } from 'lucide-react';
import { parseSQL } from '../utils/sqlParser';
import { generateSQL, downloadFile } from '../utils/sqlExporter';

import { CARD_COLORS, LINE_COLORS } from '../utils/theme';

const nodeTypes = {
    tableNode: TableNode,
};

const SchemaCanvas = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, setSchema, addTable, visualizationSettings, updateVisualizationSetting } = useSchemaStore();
    const [editingTableId, setEditingTableId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    const onConnect = useCallback((params) => console.log('Connect', params), []);
    const onNodeClick = useCallback((event, node) => {
        setEditingTableId(node.id);
    }, []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                try {
                    const { tables } = parseSQL(content);
                    setSchema(tables);
                } catch (err) {
                    console.error("Failed to parse SQL", err);
                    alert("Failed to parse SQL file.");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleExport = () => {
        const sql = generateSQL(nodes);
        downloadFile(sql, 'schema_export.sql');
    };

    return (
        <div className="h-full w-full bg-gray-50 dark:bg-slate-950 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.05}
            >
                <Background color={visualizationSettings.darkMode ? "#475569" : "#aaa"} gap={16} />
                <Controls />
                <MiniMap nodeColor={() => visualizationSettings.darkMode ? '#334155' : '#e2e8f0'} style={visualizationSettings.darkMode ? { backgroundColor: '#1e293b' } : {}} />

                <Panel position="top-right" className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                        <label className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 p-2 rounded shadow border border-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                            <Upload size={16} />
                            <span className="text-sm font-medium">Import SQL</span>
                            <input type="file" accept=".sql" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 text-gray-700 p-2 rounded shadow border border-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors" onClick={() => setShowSettings(!showSettings)}>
                            <Settings size={16} />
                            <span className="text-sm font-medium">Settings</span>
                        </button>
                        <button className="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 transition-colors" onClick={handleExport}>
                            <Download size={16} />
                            <span className="text-sm font-medium">Export</span>
                        </button>
                        <button className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 flex items-center gap-2 transition-colors" onClick={() => addTable('New_Table')}>
                            <Plus size={16} />
                            <span className="text-sm font-medium">Add Table</span>
                        </button>
                    </div>

                    {showSettings && (
                        <div className="bg-white dark:bg-slate-900 dark:border-slate-700 p-4 rounded shadow-lg border border-gray-200 w-72 flex flex-col gap-4">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Dark Mode</label>
                                <button
                                    onClick={() => updateVisualizationSetting('darkMode', !visualizationSettings.darkMode)}
                                    className={`p-1 rounded-full ${visualizationSettings.darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-gray-200 text-gray-500'}`}
                                >
                                    {visualizationSettings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                </button>
                            </div>

                            <hr className="dark:border-slate-700" />

                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-2">Line Thickness ({visualizationSettings.edgeWidth}px)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={visualizationSettings.edgeWidth}
                                    onChange={(e) => updateVisualizationSetting('edgeWidth', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-2">Line Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {LINE_COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            className={`w-6 h-6 rounded-full border border-gray-300 ${visualizationSettings.edgeColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => updateVisualizationSetting('edgeColor', color.value)}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-2">Card Background</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(CARD_COLORS).map(([key, theme]) => {
                                        const activeVal = visualizationSettings.darkMode ? theme.dark : theme.light;
                                        return (
                                            <button
                                                key={key}
                                                className={`w-6 h-6 rounded-full border border-gray-300 ${visualizationSettings.cardBgColor === key ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                                style={{ backgroundColor: activeVal }}
                                                onClick={() => updateVisualizationSetting('cardBgColor', key)}
                                                title={key}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </Panel>
            </ReactFlow>

            {editingTableId && (
                <TableEditor
                    tableId={editingTableId}
                    onClose={() => setEditingTableId(null)}
                />
            )}
        </div>
    );
};

export default SchemaCanvas;
