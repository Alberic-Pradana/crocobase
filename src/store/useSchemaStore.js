import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

const useSchemaStore = create((set, get) => ({
    nodes: [],
    edges: [],

    // React Flow changes handlers
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    // Schema Actions
    setSchema: (tables) => {
        const nodes = tables.map((table, index) => ({
            id: table.name,
            type: 'tableNode',
            position: table.position || { x: index * 300, y: 50 },
            data: {
                name: table.name,
                columns: table.columns
            },
        }));

        // Generate edges from Foreign Keys
        const edges = [];
        tables.forEach((table) => {
            table.columns.forEach((col) => {
                if (col.fk && col.fkReference) { // format table.column?
                    // fkReference usually is "table.column" or just "table"
                    // Let's assume schema stores fk info reasonably.
                    // Requirement example: "fk": "roles.id"
                    const [targetTable] = col.fkReference.split('.');
                    if (targetTable) {
                        edges.push({
                            id: `e-${table.name}-${col.name}-${targetTable}`,
                            source: table.name,
                            target: targetTable,
                            type: 'smoothstep',
                            animated: true,
                            style: { stroke: '#b1b1b7' },
                        });
                    }
                }
            });
        });

        set({ nodes, edges });
    },

    addTable: (name) => {
        const newNode = {
            id: name,
            type: 'tableNode',
            position: { x: 100, y: 100 },
            data: { name, columns: [] },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    updateTable: (oldName, newData) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === oldName
                    ? {
                        ...node,
                        id: newData.name || node.id, // Update ID if name changes? careful with edges
                        data: { ...node.data, ...newData }
                    }
                    : node
            ),
            // Need to update edges if ID changed (TODO)
        }));
    },

    removeTable: (id) => {
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
            edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        }));
    },
}));

export default useSchemaStore;
