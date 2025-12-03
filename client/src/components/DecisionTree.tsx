import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { ReactFlow, Node, Edge, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';

export function DecisionTree() {
  const { gameState, setCurrentView } = useGameStore();
  const treeRef = useRef<HTMLDivElement>(null);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Game State</h2>
          <p className="text-gray-400">Please start a game first.</p>
        </div>
      </div>
    );
  }

  const { sceneHistory, character } = gameState;

  // Build nodes and edges from scene history
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  sceneHistory.forEach((scene, index) => {
    // Scene node
    nodes.push({
      id: `scene-${scene.id}`,
      type: 'default',
      position: { x: index * 300, y: 0 },
      data: {
        label: (
          <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg min-w-[250px]">
            <div className="text-sm font-medium text-white mb-2">
              Scene {scene.sceneNumber}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {scene.description.substring(0, 100)}...
            </div>
            <div className="flex flex-wrap gap-1">
              {scene.metadata.mood && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                  {scene.metadata.mood}
                </span>
              )}
              {scene.isEnding && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                  Ending
                </span>
              )}
            </div>
          </div>
        ),
      },
      style: {
        background: scene.isEnding ? '#7C2D12' : '#374151',
        border: scene.isEnding ? '2px solid #DC2626' : '2px solid #6B7280',
        borderRadius: '8px',
      },
    });

    // Choice nodes
    scene.choices.forEach((choice, choiceIndex) => {
      const choiceNodeId = `choice-${scene.id}-${choice.id}`;
      nodes.push({
        id: choiceNodeId,
        type: 'default',
        position: { 
          x: index * 300 + (choiceIndex - scene.choices.length / 2) * 150, 
          y: 200 
        },
        data: {
          label: (
            <div className="p-3 bg-gray-700 border border-gray-500 rounded-lg min-w-[200px]">
              <div className="text-sm text-white">
                {choice.text.substring(0, 80)}...
              </div>
              {choice.consequences && choice.consequences.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {choice.consequences.slice(0, 2).map((consequence, idx) => (
                    <span
                      key={idx}
                      className="px-1 py-0.5 bg-green-500/20 text-green-400 text-xs rounded"
                    >
                      {consequence.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: '#4B5563',
          border: '2px solid #9CA3AF',
          borderRadius: '8px',
        },
      });

      // Edge from scene to choice
      edges.push({
        id: `edge-${scene.id}-${choice.id}`,
        source: `scene-${scene.id}`,
        target: choiceNodeId,
        type: 'smoothstep',
        style: { stroke: '#6B7280', strokeWidth: 2 },
      });
    });
  });

  // Connect scenes (simplified - assumes linear progression)
  for (let i = 0; i < sceneHistory.length - 1; i++) {
    const currentScene = sceneHistory[i];
    const nextScene = sceneHistory[i + 1];
    
    if (currentScene.choices.length > 0) {
      const firstChoice = currentScene.choices[0];
      edges.push({
        id: `edge-choice-${currentScene.id}-scene-${nextScene.id}`,
        source: `choice-${currentScene.id}-${firstChoice.id}`,
        target: `scene-${nextScene.id}`,
        type: 'smoothstep',
        style: { stroke: '#3B82F6', strokeWidth: 3 },
      });
    }
  }

  const handleBack = (): void => {
    if (gameState.gameProgress.isGameOver) {
      setCurrentView('ending');
    } else {
      setCurrentView('game');
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!treeRef.current) return;

    try {
      // Capture the tree visualization as canvas
      const canvas = await html2canvas(treeRef.current, {
        backgroundColor: '#1f2937', // Match your background color
        scale: 2, // Higher quality
        logging: false,
      });

      // Convert to PDF
      const imgData: string = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${character.name}-decision-tree.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Decision Tree
              </h1>
              <p className="text-gray-400">
                {character.name}'s journey through {sceneHistory.length} scenes
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleBack}
                className="btn-primary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </div>
          </div>
        </motion.div>

        {/* React Flow - This is what gets captured */}
        <motion.div
          ref={treeRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card h-[70vh]"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#374151" gap={20} />
            <Controls className="bg-gray-800 border border-gray-600" />
            <MiniMap 
              className="bg-gray-800 border border-gray-600"
              nodeColor="#6B7280"
            />
          </ReactFlow>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 card"
        >
          <h3 className="text-lg font-medium text-white mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-600 border border-gray-500 rounded mr-3"></div>
              <span className="text-gray-300">Scene</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 border border-gray-400 rounded mr-3"></div>
              <span className="text-gray-300">Choice</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-800 border border-red-600 rounded mr-3"></div>
              <span className="text-gray-300">Ending Scene</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}