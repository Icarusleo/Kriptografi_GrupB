import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import type { ComponentType } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Connection, Edge, Node, NodeProps } from '@xyflow/react'
import type { DragEvent } from 'react'
import { BLOCK_CATALOG, createBlock } from '../../../packages/blocks/src'
import type { WorkflowBlock, WorkflowEdge } from '../../../packages/core/src'
import { executeWorkflow } from '../../../packages/runtime/src'
import './App.css'
import '@xyflow/react/dist/style.css'

function App() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  )
}

type BlockNodeData = {
  label: string
  value: string
  blockType: WorkflowBlock['type']
  onValueChange: (id: string, value: string) => void
}

type FlowNode = Node<BlockNodeData, 'blockNode'>

function WorkflowEditor() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const graph = useMemo(
    () => ({
      blocks,
      edges: edges.map(
        (edge): WorkflowEdge => ({
          id: edge.id,
          from: edge.source,
          to: edge.target,
        }),
      ),
    }),
    [blocks, edges],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          },
          currentEdges,
        ),
      )
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/toolkit-node-type') as WorkflowBlock['type']
      if (!type) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const block = createBlock(type, `${type}-${Date.now()}`)
      const node: FlowNode = {
        id: block.id,
        type: 'blockNode',
        position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: block.name,
          value: '',
          blockType: block.type,
          onValueChange: (id, value) => {
            setBlocks((currentBlocks) =>
              currentBlocks.map((currentBlock) =>
                currentBlock.id === id
                  ? { ...currentBlock, data: { ...currentBlock.data, value } }
                  : currentBlock,
              ),
            )
            setNodes((currentNodes) =>
              currentNodes.map((currentNode) =>
                currentNode.id === id
                  ? { ...currentNode, data: { ...currentNode.data, value } }
                  : currentNode,
              ),
            )
          },
        },
      }

      setBlocks((currentBlocks) => [...currentBlocks, block])
      setNodes((currentNodes) => [...currentNodes, node])
    },
    [screenToFlowPosition, setNodes],
  )

  const runFlow = useCallback(async () => {
    setIsRunning(true)
    try {
      const result = await executeWorkflow(graph)
      setLogs(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setLogs([`workflow failed: ${message}`])
    } finally {
      setIsRunning(false)
    }
  }, [graph])

  const nodeTypes = useMemo(
    () => ({ blockNode: BlockNode as ComponentType<NodeProps<FlowNode>> }),
    [],
  )

  return (
    <div className="page">
      <header>
        <h1>Lightweight AEAD Workflow Builder</h1>
        <p>PHOTON-Beetle veya Elephant node'larini bagla, sonra workflow calistir.</p>
      </header>

      <section className="layout">
        <aside className="panel palette">
          <h2>Node Palette</h2>
          {BLOCK_CATALOG.map((item) => (
            <PaletteItem key={item.type} type={item.type} name={item.name} />
          ))}
        </aside>

        <main className="flow-wrapper" ref={wrapperRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </main>

        <aside className="panel runtime">
          <h2>Runtime</h2>
          <button type="button" onClick={runFlow} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Workflow'}
          </button>
          <div className="logs">
            {logs.length === 0 ? <p>No run yet.</p> : logs.map((line) => <p key={line}>{line}</p>)}
          </div>
        </aside>
      </section>
    </div>
  )
}

function PaletteItem(props: { type: WorkflowBlock['type']; name: string }) {
  return (
    <button
      type="button"
      className="palette-item"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/toolkit-node-type', props.type)
        event.dataTransfer.effectAllowed = 'move'
      }}
    >
      {props.name}
    </button>
  )
}

function BlockNode({ id, data }: NodeProps<FlowNode>) {
  return (
    <article className="flow-node">
      <Handle type="target" position={Position.Left} />
      <strong>{data.label}</strong>
      <small>{data.blockType}</small>
      <input
        value={data.value}
        placeholder="value"
        onChange={(event) => data.onValueChange(id, event.target.value)}
      />
      <Handle type="source" position={Position.Right} />
    </article>
  )
}

export default App
