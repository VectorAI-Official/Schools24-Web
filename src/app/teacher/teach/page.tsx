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
    queryFn: () => api.get<{ timetable: TimetableEntry[] }>(`/teacher/timetable?academic_year=${encodeURIComponent(academicYear)}`),
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

  useEffect(() => {
    if (classOptions.length > 0 && !selectedClassId) {
      setSelectedClassId(classOptions[0].classID)
    }
  }, [classOptions, selectedClassId])

  const subjectOptions = useMemo(() => {
    if (!selectedClassId) return []
    const set = new Set<string>()
    for (const row of timetableData?.timetable || []) {
      if (row.class_id !== selectedClassId) continue
      const subject = (row.subject_name || "").trim()
      if (subject) set.add(subject)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [selectedClassId, timetableData?.timetable])

  useEffect(() => {
    if (!selectedClassId) {
      setSelectedSubject("")
      return
    }
    if (!subjectOptions.includes(selectedSubject)) {
      setSelectedSubject(subjectOptions[0] || "")
    }
  }, [selectedClassId, subjectOptions, selectedSubject])

  const selectedClassName = useMemo(() => {
    const selected = classOptions.find((x) => x.classID === selectedClassId)
    return selected?.className || ""
  }, [selectedClassId, classOptions])

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
      return api.get<StudyMaterialsPage>(`/teacher/materials?${params.toString()}`)
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

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1"
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
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <Select
                value={selectedClassId}
                onValueChange={(value) => {
                  setSelectedClassId(value)
                  setSelectedSubject("")
                  setSelectedMaterial(null)
                }}
              >
                <SelectTrigger className="w-full md:w-[240px]">
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

              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClassId}>
                <SelectTrigger className="w-full md:w-[260px]">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={selectedClassId ? "Select subject" : "Select class first"} />
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

            <Link href="/teacher/teach/whiteboard" className="xl:ml-auto">
              <Button className="w-full xl:w-auto">
                <Monitor className="h-4 w-4 mr-2" />
                Whiteboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
              <div className="h-[600px] flex items-center justify-center text-muted-foreground border rounded-lg">
                Select a material to preview.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-[650px] border rounded-lg overflow-hidden bg-muted/20">
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
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-6 text-center">
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
    </div>
  )
}
