"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { compareClassLabels } from "@/lib/classOrdering"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  Box,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  Monitor,
  Play,
  Search,
} from "lucide-react"
import { toast } from "sonner"

// ÔöÇÔöÇ 3D Models types ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
interface Organ3D {
  id: string
  name: string
  medical_name: string
  description: string
  category: string
  filename: string
  source: string
  license: string
  available: boolean
  url: string
}

interface Organ3DList {
  models: Organ3D[]
}

function useModelViewer() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (customElements.get("model-viewer")) { setLoaded(true); return }
    import("@google/model-viewer").then(() => setLoaded(true)).catch(() => {})
  }, [])
  return loaded
}

function getBackendBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || ""
  try { return new URL(url).origin } catch { return url }
}

interface TimetableEntry {
  class_id: string
  class_name?: string
  subject_name?: string
}

interface StudyMaterial {
  id: string
  title: string
  uploader_name?: string
  uploader_role?: string
  teacher_name?: string
  subject: string
  class_level: string
  description?: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

interface StudyMaterialsPage {
  materials: StudyMaterial[]
  page: number
  page_size: number
  has_more: boolean
  next_page: number
  order: "asc" | "desc"
}

type PreviewKind = "pdf" | "txt" | "mp4" | "office" | "unknown"

const STORAGE_KEYS = {
  TOKEN: "School24_token",
  REMEMBER: "School24_remember",
} as const

function getToken(): string | null {
  if (typeof window === "undefined") return null
  const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === "true"
  const primary = remembered ? localStorage : sessionStorage
  return (
    primary.getItem(STORAGE_KEYS.TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN)
  )
}

function getCurrentAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month < 4 ? `${year - 1}-${year}` : `${year}-${year + 1}`
}

function getExt(name: string) {
  const idx = name.lastIndexOf(".")
  if (idx === -1) return ""
  return name.slice(idx + 1).toLowerCase()
}

function getPreviewKind(material: StudyMaterial | null): PreviewKind {
  if (!material) return "unknown"
  const mime = material.mime_type.toLowerCase()
  const ext = getExt(material.file_name)
  if (mime === "application/pdf" || ext === "pdf") return "pdf"
  if (mime.startsWith("video/mp4") || ext === "mp4") return "mp4"
  if (mime.startsWith("text/plain") || ext === "txt") return "txt"
  if (["doc", "docx", "ppt", "pptx"].includes(ext)) return "office"
  return "unknown"
}

export default function TeachPage() {
  const academicYear = getCurrentAcademicYear()

  // ÔöÇÔöÇ mode ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const [mode, setMode] = useState<"materials" | "3d-models">("materials")

  // ÔöÇÔöÇ 3D models state ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const [selectedOrgan, setSelectedOrgan] = useState<Organ3D | null>(null)
  const [organSearch, setOrganSearch] = useState("")
  const mvLoaded = useModelViewer()

  const { data: organsData } = useQuery({
    queryKey: ["teacher-3d-models"],
    queryFn: () => api.getOrEmpty<Organ3DList>("/teacher/3d-models", { models: [] }),
    staleTime: 5 * 60 * 1000,
    enabled: mode === "3d-models",
  })

  const filteredOrgans = useMemo(() => {
    const list = organsData?.models || []
    const q = organSearch.toLowerCase().trim()
    if (!q) return list
    return list.filter(
      (o) => o.name.toLowerCase().includes(q) || o.medical_name.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
    )
  }, [organsData?.models, organSearch])

  // auto-select first organ when list loads
  useEffect(() => {
    if (mode === "3d-models" && !selectedOrgan && filteredOrgans.length > 0) {
      setSelectedOrgan(filteredOrgans[0])
    }
  }, [mode, selectedOrgan, filteredOrgans])

  // ÔöÇÔöÇ materials state ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState<string>("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [listCollapsed, setListCollapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: timetableData } = useQuery({
    queryKey: ["teacher-teach-timetable", academicYear],
    queryFn: () => api.getOrEmpty<{ timetable: TimetableEntry[] }>(`/teacher/timetable?academic_year=${encodeURIComponent(academicYear)}`, { timetable: [] }),
    staleTime: 60 * 1000,
  })

  const classOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of timetableData?.timetable || []) {
      if (!row.class_id) continue
      const className = (row.class_name || "").trim()
      if (!className) continue
      if (!map.has(row.class_id)) map.set(row.class_id, className)
    }
    return [...map.entries()]
      .map(([classID, className]) => ({ classID, className }))
      .sort((a, b) => compareClassLabels(a.className, b.className))
  }, [timetableData?.timetable])

  const effectiveSelectedClassId = selectedClassId || classOptions[0]?.classID || ""

  const subjectOptions = useMemo(() => {
    if (!effectiveSelectedClassId) return []
    const set = new Set<string>()
    for (const row of timetableData?.timetable || []) {
      if (row.class_id !== effectiveSelectedClassId) continue
      const subject = (row.subject_name || "").trim()
      if (subject) set.add(subject)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [effectiveSelectedClassId, timetableData?.timetable])

  useEffect(() => {
    if (!effectiveSelectedClassId) {
      setSelectedSubject("")
      return
    }
    if (!subjectOptions.includes(selectedSubject)) {
      setSelectedSubject(subjectOptions[0] || "")
    }
  }, [effectiveSelectedClassId, subjectOptions, selectedSubject])

  const selectedClassName = useMemo(() => {
    const selected = classOptions.find((x) => x.classID === effectiveSelectedClassId)
    return selected?.className || ""
  }, [effectiveSelectedClassId, classOptions])

  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ["teacher-teach-materials", selectedClassName, selectedSubject, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("page_size", "100")
      params.set("order", "asc")
      if (selectedClassName) params.set("class_level", selectedClassName)
      if (selectedSubject) params.set("subject", selectedSubject)
      if (debouncedSearch) params.set("search", debouncedSearch)
      return api.getOrEmpty<StudyMaterialsPage>(`/teacher/materials?${params.toString()}`, { materials: [], page: 1, page_size: 100, has_more: false, next_page: 0, order: 'asc' })
    },
    enabled: !!selectedClassName && !!selectedSubject,
  })

  const materials = materialsData?.materials || []

  useEffect(() => {
    if (!selectedMaterial) return
    const stillExists = materials.find((m) => m.id === selectedMaterial.id)
    if (!stillExists) {
      setSelectedMaterial(materials[0] || null)
      setPreviewText("")
    }
  }, [materials, selectedMaterial])

  useEffect(() => {
    if (!selectedMaterial && materials.length > 0) {
      setSelectedMaterial(materials[0])
    }
  }, [materials, selectedMaterial])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const fetchMaterialBlob = async (id: string, mode: "view" | "download") => {
    const token = getToken()
    if (!token) throw new Error("Session expired. Please login again.")

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${baseUrl}/teacher/materials/${id}/${mode}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || err.message || `Request failed (${response.status})`)
    }

    return response.blob()
  }

  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedMaterial) return
      const kind = getPreviewKind(selectedMaterial)

      setPreviewLoading(true)
      setPreviewText("")
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      try {
        const blob = await fetchMaterialBlob(selectedMaterial.id, "view")

        if (kind === "txt") {
          const text = await blob.text()
          setPreviewText(text)
        } else {
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        }
      } catch (error) {
        toast.error("Failed to load preview", {
          description: error instanceof Error ? error.message : "Unexpected error",
        })
      } finally {
        setPreviewLoading(false)
      }
    }

    void loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterial?.id])

  const previewKind = getPreviewKind(selectedMaterial)

  return (
    <div className="space-y-4">
      {/* ÔöÇÔöÇ Top Control Bar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* Class/Subject selectors ÔÇö hidden in 3D mode */}
            {mode === "materials" && (
              <div className="flex flex-col xl:flex-row gap-3 flex-1">
                <Select
                  value={effectiveSelectedClassId}
                  onValueChange={(value) => {
                    setSelectedClassId(value)
                    setSelectedSubject("")
                    setSelectedMaterial(null)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((opt) => (
                      <SelectItem key={opt.classID} value={opt.classID}>
                        {opt.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!effectiveSelectedClassId}>
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={effectiveSelectedClassId ? "Select subject" : "Select class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "3d-models" && (
              <div className="flex-1 flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">3D Anatomy Models</span>
                <Badge variant="secondary" className="text-xs">BodyParts3D ┬À CC BY-SA</Badge>
              </div>
            )}

            <div className="flex gap-2 xl:ml-auto">
              <Button
                variant={mode === "3d-models" ? "default" : "outline"}
                className="w-full sm:w-auto"
                onClick={() => {
                  setMode((m) => (m === "3d-models" ? "materials" : "3d-models"))
                  setSelectedOrgan(null)
                }}
              >
                <Box className="h-4 w-4 mr-2" />
                3D Models
              </Button>

              {mode === "materials" && (
                <Link href="/teacher/teach/whiteboard">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Monitor className="h-4 w-4 mr-2" />
                    Whiteboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ÔöÇÔöÇ 3D Models Layout ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
      {mode === "3d-models" && (
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Left: organ list */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search organsÔÇª"
                  value={organSearch}
                  onChange={(e) => setOrganSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {filteredOrgans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No organs found</p>
                ) : (
                  filteredOrgans.map((organ) => {
                    const active = selectedOrgan?.id === organ.id
                    return (
                      <button
                        key={organ.id}
                        type="button"
                        onClick={() => setSelectedOrgan(organ)}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "hover:bg-muted/50 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-sm">{organ.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{organ.medical_name}</p>
                        {!organ.available && (
                          <Badge variant="outline" className="text-[10px] mt-1 text-yellow-600 border-yellow-400">
                            unavailable
                          </Badge>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: 3D viewer */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 h-full">
              {!selectedOrgan ? (
                <div className="h-[calc(100vh-200px)] min-h-[480px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Box className="h-12 w-12 opacity-30" />
                  <p className="text-sm">Select an organ to view its 3D model</p>
                </div>
              ) : !selectedOrgan.available ? (
                <div className="h-[calc(100vh-200px)] min-h-[480px] flex flex-col items-center justify-center text-muted-foreground gap-3 p-6">
                  <Box className="h-12 w-12 opacity-30" />
                  <p className="font-medium">{selectedOrgan.name} model not yet available</p>
                  <p className="text-sm text-center max-w-xs">
                    Place <code className="bg-muted px-1 rounded text-xs">{selectedOrgan.filename}</code> in{" "}
                    <code className="bg-muted px-1 rounded text-xs">uploads/3d-models/</code> on the server.
                  </p>
                </div>
              ) : !mvLoaded ? (
                <div className="h-[calc(100vh-200px)] min-h-[480px] flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading 3D engineÔÇª
                </div>
              ) : (
                <div className="relative h-[calc(100vh-200px)] min-h-[480px]">
                  {/* @ts-expect-error model-viewer web component */}
                  <model-viewer
                    src={`${getBackendBase()}/uploads/3d-models/${selectedOrgan.filename}`}
                    camera-controls
                    auto-rotate
                    auto-rotate-delay="1500"
                    shadow-intensity="1.4"
                    shadow-softness="0.6"
                    exposure="1.35"
                    tone-mapping="aces"
                    environment-image="legacy"
                    style={{ width: "100%", height: "100%", backgroundColor: "#0f172a" }}
                    loading="eager"
                    interaction-prompt="auto"
                    disable-tap
                  />
                  {/* Organ info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 pointer-events-none">
                    <p className="text-white font-semibold">{selectedOrgan.name}</p>
                    <p className="text-white/80 text-xs italic">{selectedOrgan.medical_name}</p>
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{selectedOrgan.description}</p>
                    <p className="text-white/50 text-[10px] mt-1">{selectedOrgan.license} ┬À {selectedOrgan.source}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ÔöÇÔöÇ Materials Layout ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
      {mode === "materials" && (
        <div
          className={`grid gap-4 grid-cols-1 ${
            listCollapsed ? "xl:grid-cols-[56px_minmax(0,1fr)]" : "xl:grid-cols-[360px_minmax(0,1fr)]"
          }`}
        >
          <Card className={listCollapsed ? "xl:col-span-1" : ""}>
            <CardContent className="p-2">
              <div className="flex items-center gap-2 p-2">
                {!listCollapsed ? (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      placeholder="Search by title, file or topic"
                    />
                  </div>
                ) : null}
                <Button variant="outline" size="icon" onClick={() => setListCollapsed((prev) => !prev)}>
                  {listCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              {!listCollapsed ? (
                <div className="space-y-3 p-2 pt-1">
                  <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1">
                    {isMaterialsLoading ? (
                      <div className="flex items-center justify-center text-muted-foreground py-12 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading materials...
                      </div>
                    ) : materials.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-12 text-center">No materials found for selected class/subject.</div>
                    ) : (
                      materials.map((material) => {
                        const active = selectedMaterial?.id === material.id
                        return (
                          <button
                            type="button"
                            key={material.id}
                            onClick={() => setSelectedMaterial(material)}
                            className={`w-full text-left rounded-lg border p-3 transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                          >
                            <p className="font-medium truncate">{material.title || material.file_name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-1">{material.file_name}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>{material.subject}</span>
                              <span>{material.class_level}</span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {!selectedMaterial ? (
                <div className="h-[52vh] min-h-[320px] md:h-[600px] flex items-center justify-center text-muted-foreground border rounded-lg">
                  Select a material to preview.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[58vh] min-h-[360px] md:h-[650px] border rounded-lg overflow-hidden bg-muted/20">
                    {previewLoading ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading preview...
                      </div>
                    ) : previewKind === "pdf" && previewUrl ? (
                      <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                    ) : previewKind === "mp4" && previewUrl ? (
                      <video className="w-full h-full bg-black" controls src={previewUrl} />
                    ) : previewKind === "txt" ? (
                      <pre className="h-full w-full p-4 text-sm whitespace-pre-wrap overflow-auto">{previewText || "No text content."}</pre>
                    ) : previewKind === "office" && previewUrl ? (
                      <div className="h-full flex flex-col">
                        <iframe src={previewUrl} className="w-full flex-1" title="Office Preview" />
                        <div className="p-2 border-t text-xs text-muted-foreground">
                          If your browser cannot render this file inline, use Download.
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 md:p-6 text-center">
                        <FileText className="h-8 w-8" />
                        <p>Inline preview not available for this file.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, MP4</Badge>
                    {previewKind === "office" ? (
                      <Badge variant="secondary"><Play className="h-3 w-3 mr-1" /> Office preview may vary by browser</Badge>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
