import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 50,
        ranksep: 100
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: node.width || 250, height: node.height || 150 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - (node.width || 250) / 2,
            y: nodeWithPosition.y - (node.height || 150) / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};

const useSchemaStore = create(persist((set, get) => ({
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

    // Visualization Settings
    visualizationSettings: {
        edgeColor: '#b1b1b7',
        edgeWidth: 2,
        cardBgColor: '#ffffff'
    },

    updateVisualizationSetting: (key, value) => {
        set((state) => {
            const newSettings = { ...state.visualizationSettings, [key]: value };

            // If edge settings changed, update existing edges
            let newEdges = state.edges;
            if (key === 'edgeColor' || key === 'edgeWidth') {
                newEdges = state.edges.map(edge => ({
                    ...edge,
                    style: {
                        ...edge.style,
                        stroke: key === 'edgeColor' ? value : newSettings.edgeColor,
                        strokeWidth: key === 'edgeWidth' ? value : newSettings.edgeWidth,
                    }
                }));
            }

            return {
                visualizationSettings: newSettings,
                edges: newEdges
            };
        });
    },

    // Schema Actions
    setSchema: (tables) => {
        // Generate nodes first
        let nodes = tables.map((table) => ({
            id: table.name,
            type: 'tableNode',
            position: { x: 0, y: 0 }, // Will be set by dagre
            data: {
                name: table.name,
                columns: table.columns
            },
            width: 250, // Approximation for dagre
            height: 40 + (table.columns.length * 32),
        }));

        const { edgeColor, edgeWidth } = get().visualizationSettings;

        // Generate edges
        const edges = [];
        tables.forEach((table) => {
            table.columns.forEach((col) => {
                if (col.fk && col.fkReference) {
                    const [targetTable, targetCol] = col.fkReference.split('.');
                    if (targetTable) {
                        // Ensure unique ID for edge
                        edges.push({
                            id: `e-${table.name}-${col.name}-${targetTable}`,
                            source: table.name,
                            target: targetTable,
                            sourceHandle: `${col.name}-source`,
                            targetHandle: `${targetCol}-target`,
                            type: 'smoothstep',
                            animated: true,
                            style: { stroke: edgeColor, strokeWidth: edgeWidth },
                        });
                    }
                }
            });
        });

        // Apply Dagre Layout
        const layout = getLayoutedElements(nodes, edges);
        set({ nodes: layout.nodes, edges: layout.edges });
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
}), {
    name: 'schema-storage',
    partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        visualizationSettings: state.visualizationSettings,
    }),
}));

export default useSchemaStore;
