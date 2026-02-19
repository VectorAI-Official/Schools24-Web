"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, Calendar, Eye, GraduationCap, Loader2, Plus, Search, Upload } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface HomeworkSubjectOption {
  subject_id: string
  subject_name: string
}

interface HomeworkClassOption {
  class_id: string
  class_name: string
  class_level: string
  subjects: HomeworkSubjectOption[]
}

interface HomeworkAttachment {
  id: string
  file_name?: string
  file_size?: number
  mime_type?: string
}

interface HomeworkItem {
  id: string
  title: string
  description?: string
  class_id: string
  class_name: string
  subject_id?: string
  subject_name?: string
  due_date: string
  max_marks: number
  status: string
  submissions_count: number
  students_count: number
  attachment_count: number
  has_attachments: boolean
  attachments: HomeworkAttachment[]
  created_at: string
}

const STORAGE_KEYS = {
  TOKEN: "School24_token",
  REMEMBER: "School24_remember",
}

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

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString()
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let idx = 0
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024
    idx++
  }
  return `${size.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

export default function HomeworkPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [openAssign, setOpenAssign] = useState(false)
  const [viewHomework, setViewHomework] = useState<HomeworkItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [maxMarks, setMaxMarks] = useState("100")
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const optionsQuery = useQuery({
    queryKey: ["teacher-homework-options"],
    queryFn: () => api.get<{ options: HomeworkClassOption[] }>("/teacher/homework/options"),
  })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const listQuery = useQuery({
    queryKey: ["teacher-homework-list", classFilter, subjectFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("page_size", "100")
      if (classFilter !== "all") params.set("class_id", classFilter)
      if (subjectFilter !== "all") params.set("subject_id", subjectFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)
      return api.get<{ homework: HomeworkItem[] }>(`/teacher/homework?${params.toString()}`)
    },
  })

  const classOptions = optionsQuery.data?.options || []
  const selectedClass = useMemo(
    () => classOptions.find((c) => c.class_id === classId) || null,
    [classOptions, classId]
  )
  const subjectOptions = selectedClass?.subjects || []
  const selectedFilterClass = useMemo(
    () => classOptions.find((c) => c.class_id === classFilter) || null,
    [classOptions, classFilter]
  )
  const subjectFilterOptions = selectedFilterClass?.subjects || []

  const homeworks = listQuery.data?.homework || []
  const activeCount = homeworks.filter((h) => h.status === "active").length
  const totalSubmissions = homeworks.reduce((sum, h) => sum + h.submissions_count, 0)
  const totalPending = homeworks.reduce(
    (sum, h) => sum + Math.max(0, h.students_count - h.submissions_count),
    0
  )

  const resetForm = () => {
    setTitle("")
    setClassId("")
    setSubjectId("")
    setDueDate("")
    setDescription("")
    setMaxMarks("100")
    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required")
      if (!classId) throw new Error("Class is required")
      if (!subjectId) throw new Error("Subject is required")
      if (!dueDate) throw new Error("Due date is required")
      const token = getToken()
      if (!token) throw new Error("Session expired. Please login again.")

      const form = new FormData()
      form.append("title", title.trim())
      form.append("class_id", classId)
      form.append("subject_id", subjectId)
      form.append("due_date", dueDate)
      form.append("description", description.trim())
      form.append("max_marks", maxMarks || "100")
      files.forEach((file) => form.append("attachments", file))

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1"
      const response = await fetch(`${baseUrl}/teacher/homework`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed (${response.status})`)
      }
      return data
    },
    onSuccess: () => {
      toast.success("Homework assigned")
      setOpenAssign(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["teacher-homework-list"] })
    },
    onError: (error: unknown) => {
      toast.error("Failed to assign homework", {
        description: error instanceof Error ? error.message : "Unexpected error",
      })
    },
  })

  const downloadAttachment = async (homeworkID: string, attachmentID: string, fileName?: string) => {
    const token = getToken()
    if (!token) {
      toast.error("Session expired. Please login again.")
      return
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1"
    const response = await fetch(
      `${baseUrl}/teacher/homework/${homeworkID}/attachments/${attachmentID}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (!response.ok) {
      toast.error("Failed to download attachment")
      return
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "attachment"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const picked = Array.from(incoming)
    const maxCount = 5
    const merged = [...files, ...picked].slice(0, maxCount)
    setFiles(merged)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Homework</h1>
          <p className="text-muted-foreground">Create and manage homework assignments</p>
        </div>
        <Dialog open={openAssign} onOpenChange={setOpenAssign}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Homework
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign New Homework</DialogTitle>
              <DialogDescription>Create a new homework assignment for your students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter homework title" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select
                    value={classId}
                    onValueChange={(value) => {
                      setClassId(value)
                      setSubjectId("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((opt) => (
                        <SelectItem key={opt.class_id} value={opt.class_id}>
                          {opt.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                    <SelectTrigger>
                      <SelectValue placeholder={classId ? "Select subject" : "Select class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((opt) => (
                        <SelectItem key={opt.subject_id} value={opt.subject_id}>
                          {opt.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Max Marks</Label>
                  <Input type="number" min={1} max={1000} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Enter homework description and instructions" />
              </div>
              <div className="grid gap-2">
                <Label>Attachments</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? "border-primary bg-primary/5" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                    handleFiles(e.dataTransfer.files)
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Drop files here or click to upload (max 5)</p>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Choose Files
                  </Button>
                </div>
                {files.length > 0 ? (
                  <div className="space-y-1">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="text-xs text-muted-foreground flex justify-between">
                        <span>{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAssign(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Homework"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                placeholder="Search by title or description"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 xl:w-auto">
              <Select
                value={classFilter}
                onValueChange={(value) => {
                  setClassFilter(value)
                  setSubjectFilter("all")
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((opt) => (
                    <SelectItem key={opt.class_id} value={opt.class_id}>
                      {opt.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={classFilter === "all"}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={classFilter === "all" ? "Select class first" : "All Subjects"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectFilterOptions.map((opt) => (
                    <SelectItem key={opt.subject_id} value={opt.subject_id}>
                      {opt.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-xl md:text-3xl font-bold text-primary">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-xl md:text-3xl font-bold text-green-500">{totalSubmissions}</p>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-xl md:text-3xl font-bold text-yellow-500">{totalPending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {listQuery.isLoading ? (
          <Card>
            <CardContent className="p-4 md:p-6 text-center text-muted-foreground">Loading homework...</CardContent>
          </Card>
        ) : homeworks.length === 0 ? (
          <Card>
            <CardContent className="p-4 md:p-6 text-center text-muted-foreground">No homework assigned yet.</CardContent>
          </Card>
        ) : (
          homeworks.map((homework) => (
            <Card key={homework.id} className="card-hover">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{homework.title}</h3>
                        <Badge variant={homework.status === "active" ? "success" : "secondary"}>{homework.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>{homework.subject_name || "Unknown Subject"}</span>
                        <span>•</span>
                        <span>{homework.class_name}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(homework.due_date)}
                        </div>
                        {homework.attachment_count > 0 ? (
                          <>
                            <span>•</span>
                            <span>{homework.attachment_count} attachment(s)</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center px-6">
                      <p className="text-2xl font-bold">
                        {homework.submissions_count}/{homework.students_count}
                      </p>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewHomework(homework)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!viewHomework} onOpenChange={(open) => !open && setViewHomework(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewHomework?.title}</DialogTitle>
            <DialogDescription>
              {viewHomework?.subject_name} • {viewHomework?.class_name}
            </DialogDescription>
          </DialogHeader>
          {viewHomework ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{viewHomework.description || "No description"}</p>
              <p className="text-sm">Due: {formatDate(viewHomework.due_date)}</p>
              <p className="text-sm">
                Submissions: {viewHomework.submissions_count}/{viewHomework.students_count}
              </p>
              <div className="space-y-2">
                <Label>Attachments</Label>
                {viewHomework.attachments?.length ? (
                  viewHomework.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-sm">
                        <p>{att.file_name || "Attachment"}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(viewHomework.id, att.id, att.file_name)}
                      >
                        Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
