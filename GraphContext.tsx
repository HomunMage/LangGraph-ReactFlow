// Graph/GraphContext.tsx

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Node, Edge, NodeChange, applyNodeChanges } from '@xyflow/react';

interface SubGraph {
    graphName: string;
    nodes: Node[];
    edges: Edge[];
    serial_number: number;
}

interface GraphContextType {
    subGraphs: SubGraph[];
    currentGraphName: string;
    addSubGraph: (graphName: string) => void;
    renameSubGraph: (oldName: string, newName: string) => void;
    updateSubGraph: (graphName: string, updatedGraph: SubGraph) => void;
    removeSubGraph: (graphName: string) => void;
    setCurrentGraphName: (graphName: string) => void;
    updateNodeData: (graphName: string, nodeId: string, newData: any) => void;
    handleNodesChange: (graphName: string, changes: NodeChange[]) => void;
}

const initialGraphData = {
    graphName: "root",
    nodes: [],
    edges: [],
    serial_number: 0,
};

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [subGraphs, setSubGraphs] = useState<SubGraph[]>([]);
    const [currentGraphName, setCurrentGraphNameState] = useState<string>("root");


    const addSubGraph = (graphName: string) => {
        setSubGraphs(prevGraphs => {
            const newSubgraphs = [...prevGraphs, {
                graphName,
                nodes: [],
                edges: [],
                serial_number: 0,
            }]
            if(!currentGraphName) setCurrentGraphNameState(graphName);
            return newSubgraphs;
           
        });

    };
    
    const renameSubGraph = (oldName: string, newName: string) => {
        setSubGraphs(prevGraphs => {
            return prevGraphs.map(graph => {
                if (graph.graphName === oldName) {
                    return { ...graph, graphName: newName };
                }
                return graph;
            })
        })
        if(currentGraphName === oldName){
            setCurrentGraphNameState(newName);
        }
    }

    const updateSubGraph = (graphName: string, updatedGraph: SubGraph) => {
        setSubGraphs(prevGraphs => {
            const graphIndex = prevGraphs.findIndex(graph => graph.graphName === graphName);
            if (graphIndex === -1) {
                return [...prevGraphs, updatedGraph]
            } else {
                return prevGraphs.map((graph, index) => index === graphIndex ? updatedGraph : graph)
            }
        });
    };

    const removeSubGraph = (graphName: string) => {
        setSubGraphs(prevGraphs => prevGraphs.filter(graph => graph.graphName !== graphName));
        if (currentGraphName === graphName) {
            setCurrentGraphNameState("root")
        }
    };
   

    const setCurrentGraphName = (graphName: string) => {
        setCurrentGraphNameState(graphName);
    };


    const updateNodeData = (graphName: string, nodeId: string, newData: any) => {
        setSubGraphs(prevGraphs => {
            return prevGraphs.map(graph => {
                if(graph.graphName === graphName){
                    return {
                        ...graph,
                        nodes: graph.nodes.map(node =>{
                            if(node.id === nodeId){
                                return {
                                    ...node,
                                    data: {...node.data, ...newData}
                                }
                            }
                            return node;
                        })
                    }
                }
                return graph;
            })
        })
    }

    const handleNodesChange = useCallback((graphName: string, changes: NodeChange[]) => {
        setSubGraphs((prevGraphs) => {
            return prevGraphs.map(graph => {
                if(graph.graphName === graphName){
                    const updatedNodes = applyNodeChanges(changes, graph.nodes);
                    return { ...graph, nodes: updatedNodes };
                }
                return graph;
            })
        })
    }, []);
    
    
    //Initialize root graph if not exist
    React.useEffect(()=>{
        const rootGraphExist = subGraphs.find(graph => graph.graphName === "root")
        if(!rootGraphExist){
            setSubGraphs([{...initialGraphData}]);
        }
    }, [subGraphs])

    const value = {
        subGraphs,
        currentGraphName,
        addSubGraph,
        renameSubGraph,
        updateSubGraph,
        removeSubGraph,
        setCurrentGraphName,
        updateNodeData,
        handleNodesChange,
    };

    return (
        <GraphContext.Provider value={value}>
            {children}
        </GraphContext.Provider>
    );
};

export const useGraph = () => {
    const context = useContext(GraphContext);
    if (!context) {
        throw new Error('useGraph must be used within a GraphProvider');
    }
    return context;
};