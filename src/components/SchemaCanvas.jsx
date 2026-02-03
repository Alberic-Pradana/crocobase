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
import { Download, Upload, Plus, Trash2, Settings } from 'lucide-react';
import { parseSQL } from '../utils/sqlParser';
import { generateSQL, downloadFile } from '../utils/sqlExporter';

const nodeTypes = {
    tableNode: TableNode,
};

const SchemaCanvas = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, setSchema, addTable, visualizationSettings, updateVisualizationSetting } = useSchemaStore();
    const [editingTableId, setEditingTableId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    const LINE_COLORS = [
        { name: 'Slate', value: '#64748b' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' },
    ];

    const CARD_COLORS = [
        { name: 'White', value: '#ffffff' },
        { name: 'Gray', value: '#f9fafb' }, // gray-50
        { name: 'Blue', value: '#eff6ff' }, // blue-50
        { name: 'Green', value: '#f0fdf4' }, // green-50
        { name: 'Yellow', value: '#fefce8' }, // yellow-50
        { name: 'Red', value: '#fef2f2' }, // red-50
    ];

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
        <div className="h-full w-full bg-gray-50 relative">
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
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap nodeColor={() => '#e2e8f0'} />

                <Panel position="top-right" className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                        <label className="bg-white p-2 rounded shadow border border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                            <Upload size={16} />
                            <span className="text-sm font-medium">Import SQL</span>
                            <input type="file" accept=".sql" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button className="bg-white text-gray-700 p-2 rounded shadow border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={() => setShowSettings(!showSettings)}>
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
                        <div className="bg-white p-4 rounded shadow-lg border border-gray-200 w-72 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Line Thickness ({visualizationSettings.edgeWidth}px)</label>
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
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Line Color</label>
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
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Card Background</label>
                                <div className="flex gap-2 flex-wrap">
                                    {CARD_COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            className={`w-6 h-6 rounded-full border border-gray-300 ${visualizationSettings.cardBgColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => updateVisualizationSetting('cardBgColor', color.value)}
                                            title={color.name}
                                        />
                                    ))}
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
