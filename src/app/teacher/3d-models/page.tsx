"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Brain,
  Heart,
  Loader2,
  Info,
  RotateCcw,
  Maximize2,
  Eye,
  Box,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Model3D {
  id: string
  name: string
  medical_name: string
  description: string
  category: "organ" | "cell" | "structure"
  filename: string
  file_path: string
  source: string
  license: string
  available: boolean
}

interface ModelsResponse {
  models: Model3D[]
  message?: string
}

// ---------------------------------------------------------------------------
// Organ icon mapping (lucide doesn't have organ-specific icons for all,
// so we use semantic matches)
// ---------------------------------------------------------------------------

const ORGAN_ICONS: Record<string, React.ReactNode> = {
  brain: <Brain className="h-8 w-8" />,
  heart: <Heart className="h-8 w-8" />,
  lungs: <Box className="h-8 w-8" />,
  kidney: <Box className="h-8 w-8" />,
  liver: <Box className="h-8 w-8" />,
  neuron: <Box className="h-8 w-8" />,
  nephron: <Box className="h-8 w-8" />,
}

const ORGAN_COLORS: Record<string, string> = {
  brain: "from-pink-500/20 to-purple-500/20",
  heart: "from-red-500/20 to-rose-500/20",
  lungs: "from-blue-500/20 to-cyan-500/20",
  kidney: "from-amber-500/20 to-orange-500/20",
  liver: "from-emerald-500/20 to-teal-500/20",
  neuron: "from-violet-500/20 to-indigo-500/20",
  nephron: "from-yellow-500/20 to-lime-500/20",
}

const CATEGORY_LABELS: Record<string, string> = {
  organ: "Organ",
  cell: "Cell",
  structure: "Microscopic Structure",
}

// ---------------------------------------------------------------------------
// Model viewer loader — registers the custom element once
// ---------------------------------------------------------------------------

let modelViewerLoaded = false

function useModelViewer() {
  const [ready, setReady] = useState(modelViewerLoaded)

  useEffect(() => {
    if (modelViewerLoaded) {
      setReady(true)
      return
    }
    import("@google/model-viewer")
      .then(() => {
        modelViewerLoaded = true
        setReady(true)
      })
      .catch((err) => {
        console.error("Failed to load model-viewer:", err)
        toast.error("Failed to load 3D viewer component")
      })
  }, [])

  return ready
}

// ---------------------------------------------------------------------------
// API base URL for constructing model file URLs
// ---------------------------------------------------------------------------

function getBackendBaseURL(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
  // NEXT_PUBLIC_API_URL is like "http://localhost:8080/api/v1"
  // We need just the origin for static file URLs: "http://localhost:8080"
  try {
    const u = new URL(apiUrl)
    return u.origin
  } catch {
    return ""
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ThreeDModelsPage() {
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const viewerReady = useModelViewer()

  // Fetch model list from backend
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ModelsResponse>({
    queryKey: ["teacher", "3d-models"],
    queryFn: () => api.get<ModelsResponse>("/teacher/3d-models"),
    staleTime: 5 * 60 * 1000, // 5 min — model list rarely changes
  })

  const models = data?.models ?? []
  const backendBase = getBackendBaseURL()

  // ------ Gallery View ------
  if (!selectedModel) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            3D Anatomy Models
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive 3D models for classroom teaching. Click any model to
            open the viewer.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load models: {(error as Error)?.message || "Unknown error"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && models.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Box className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No models configured</h3>
              <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                3D anatomy models haven&apos;t been set up yet. Contact your
                administrator to add glTF model files.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Model Cards Grid */}
        {models.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onSelect={() => setSelectedModel(model)}
              />
            ))}
          </div>
        )}

        {/* Attribution footer */}
        {models.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            Organ models sourced from BodyParts3D (DBCLS, Japan) under CC BY-SA 2.1.
            Cell/structure models sourced under respective Creative Commons licenses.
          </p>
        )}
      </div>
    )
  }

  // ------ Viewer View ------
  const modelSrc = selectedModel.available
    ? `${backendBase}${selectedModel.file_path}`
    : ""

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedModel(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {selectedModel.name}
          </h2>
          <p className="text-xs text-muted-foreground italic truncate">
            {selectedModel.medical_name}
          </p>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex">
          {CATEGORY_LABELS[selectedModel.category] || selectedModel.category}
        </Badge>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setInfoOpen(true)}
          title="Model info"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Viewer area */}
      <div className="flex-1 relative bg-muted/30">
        {!selectedModel.available ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <Box className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Model file not available</h3>
            <p className="text-muted-foreground mt-2 max-w-lg">
              The file <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{selectedModel.filename}</code> has
              not been placed in the server&apos;s <code className="bg-muted px-1.5 py-0.5 rounded text-sm">uploads/3d-models/</code> directory yet.
            </p>
            <div className="mt-6 p-4 bg-muted rounded-lg text-left text-sm max-w-lg w-full">
              <p className="font-medium mb-2">Setup steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Download the OBJ mesh from BodyParts3D</li>
                <li>Open in Blender &rarr; File &rarr; Export &rarr; glTF 2.0 (.glb)</li>
                <li>
                  Copy <code className="bg-background px-1 rounded">{selectedModel.filename}</code> to{" "}
                  <code className="bg-background px-1 rounded">uploads/3d-models/</code>
                </li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        ) : !viewerReady ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <model-viewer
            src={modelSrc}
            alt={`3D model of ${selectedModel.name} (${selectedModel.medical_name})`}
            camera-controls=""
            auto-rotate=""
            auto-rotate-delay="1000"
            shadow-intensity="0.8"
            shadow-softness="0.5"
            exposure="1"
            interaction-prompt="auto"
            loading="eager"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              outline: "none",
            }}
          >
            {/* Loading slot */}
            <div
              slot="progress-bar"
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20"
            >
              <div className="h-full bg-primary animate-pulse" />
            </div>
          </model-viewer>
        )}

        {/* Viewer controls hint */}
        {selectedModel.available && viewerReady && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              Drag to rotate
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Maximize2 className="h-3 w-3" />
              Scroll to zoom
            </Badge>
          </div>
        )}
      </div>

      {/* Info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedModel.name}</DialogTitle>
            <DialogDescription className="italic">
              {selectedModel.medical_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>{selectedModel.description}</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <span className="text-muted-foreground">Category</span>
              <span>{CATEGORY_LABELS[selectedModel.category] || selectedModel.category}</span>
              <span className="text-muted-foreground">Source</span>
              <span>{selectedModel.source}</span>
              <span className="text-muted-foreground">License</span>
              <span>{selectedModel.license}</span>
              <span className="text-muted-foreground">File</span>
              <span className="font-mono text-xs">{selectedModel.filename}</span>
              <span className="text-muted-foreground">Status</span>
              <span>
                {selectedModel.available ? (
                  <Badge variant="default" className="text-xs">Available</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not uploaded</Badge>
                )}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gallery Card
// ---------------------------------------------------------------------------

function ModelCard({
  model,
  onSelect,
}: {
  model: Model3D
  onSelect: () => void
}) {
  const gradient = ORGAN_COLORS[model.id] || "from-gray-500/20 to-gray-400/20"
  const icon = ORGAN_ICONS[model.id] || <Box className="h-8 w-8" />

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onSelect}
    >
      {/* Gradient banner with icon */}
      <div
        className={`h-32 flex items-center justify-center bg-gradient-to-br ${gradient} rounded-t-lg transition-transform`}
      >
        <div className="text-foreground/70 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base leading-tight">
              {model.name}
            </CardTitle>
            <CardDescription className="text-xs italic mt-0.5">
              {model.medical_name}
            </CardDescription>
          </div>
          <Badge
            variant={model.available ? "default" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {model.available ? "Ready" : "Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {model.description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_LABELS[model.category] || model.category}
          </Badge>
          <span className="flex-1" />
          <Button
            size="sm"
            variant={model.available ? "default" : "outline"}
            className="h-7 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Eye className="h-3 w-3" />
            {model.available ? "View" : "Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
