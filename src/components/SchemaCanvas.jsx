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
import { Download, Upload, Plus, Trash2 } from 'lucide-react';
import { parseSQL } from '../utils/sqlParser';
import { generateSQL, downloadFile } from '../utils/sqlExporter';

const nodeTypes = {
    tableNode: TableNode,
};

const SchemaCanvas = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, setSchema, addTable } = useSchemaStore();
    const [editingTableId, setEditingTableId] = useState(null);

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
            >
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap nodeColor={() => '#e2e8f0'} />

                <Panel position="top-right" className="flex gap-2">
                    <label className="bg-white p-2 rounded shadow border border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                        <Upload size={16} />
                        <span className="text-sm font-medium">Import SQL</span>
                        <input type="file" accept=".sql" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button className="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 transition-colors" onClick={handleExport}>
                        <Download size={16} />
                        <span className="text-sm font-medium">Export</span>
                    </button>
                    <button className="bg-yellow-500 text-white p-2 rounded shadow hover:bg-yellow-600 flex items-center gap-2 transition-colors" onClick={() => addTable('New_Table')}>
                        <Plus size={16} />
                        <span className="text-sm font-medium">Add Table</span>
                    </button>
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
