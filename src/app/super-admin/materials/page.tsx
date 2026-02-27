"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { compareClassLabels } from '@/lib/classOrdering'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Download, Eye, File, FileText, Filter, GraduationCap, Loader2, Search, Trash2, Upload, X } from 'lucide-react'

interface CatalogClass {
  id: string
  name: string
  sort_order: number
}

interface CatalogSubject {
  id: string
  name: string
  code?: string
}

interface StudyMaterial {
  id: string
  title: string
  uploader_name?: string
  uploader_role?: string
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
  order: 'asc' | 'desc'
}

const STORAGE_KEYS = {
  TOKEN: 'School24_token',
  REMEMBER: 'School24_remember',
} as const

const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'mp4']
const MAX_FILE_SIZE = 25 * 1024 * 1024

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
  const primary = remembered ? localStorage : sessionStorage
  return primary.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB']
  let n = bytes
  let idx = 0
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024
    idx += 1
  }
  return `${n.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`
}

function isPdf(mimeType: string, fileName: string) {
  return mimeType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
}

export function SuperAdminMaterialsForm() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: classesData } = useQuery({
    queryKey: ['super-admin-catalog-classes', 'materials'],
    queryFn: () => api.get<{ classes: CatalogClass[] }>('/super-admin/catalog/classes'),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['super-admin-catalog-subjects', 'materials'],
    queryFn: () => api.get<{ subjects: CatalogSubject[] }>('/super-admin/catalog/subjects'),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

  const classOptions = useMemo(() => {
    return [...(classesData?.classes || [])].sort((a, b) => compareClassLabels(a.name, b.name))
  }, [classesData?.classes])

  const subjectOptions = useMemo(() => {
    return [...(subjectsData?.subjects || [])].map((s) => s.name).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [subjectsData?.subjects])

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['super-admin-materials', 20, 'asc', subjectFilter, classFilter, debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('page_size', '20')
      params.set('order', 'asc')
      if (subjectFilter !== 'all') params.set('subject', subjectFilter)
      if (classFilter !== 'all') params.set('class_level', classFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      return api.get<StudyMaterialsPage>(`/super-admin/materials?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_page : undefined),
    staleTime: 30_000,
  })

  useEffect(() => {
    const onScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return
      const el = document.documentElement
      const scrollTop = window.scrollY || el.scrollTop
      const viewportBottom = scrollTop + window.innerHeight
      const threshold = el.scrollHeight * 0.8
      if (viewportBottom >= threshold) fetchNextPage()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const materials = useMemo(() => data?.pages.flatMap((p) => p.materials) || [], [data])

  const fetchMaterialBlob = async (id: string, mode: 'view' | 'download') => {
    const token = getToken()
    if (!token) throw new Error('Session expired. Please login again.')

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${baseUrl}/super-admin/materials/${id}/${mode}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || err.message || `Request failed (${response.status})`)
    }
    return response.blob()
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Choose a file first')
      if (!title.trim()) throw new Error('Title is required')
      if (!selectedClass) throw new Error('Class is required')
      if (!selectedSubject) throw new Error('Subject is required')

      const token = getToken()
      if (!token) throw new Error('Session expired. Please login again.')

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('subject', selectedSubject)
      formData.append('class_level', selectedClass)

      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${baseUrl}/super-admin/materials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || err.message || `Upload failed (${response.status})`)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Study material uploaded')
      setTitle('')
      setDescription('')
      setSelectedClass('')
      setSelectedSubject('')
      setSelectedFile(null)
      setUploadOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['super-admin-materials'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error('Upload failed', { description: message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/materials/${id}`),
    onSuccess: () => {
      toast.success('Study material deleted')
      queryClient.invalidateQueries({ queryKey: ['super-admin-materials'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Delete failed'
      toast.error('Delete failed', { description: message })
    },
  })

  const validateAndSetFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Invalid format', { description: 'Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, MP4' })
      return
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      toast.error('Invalid file size', { description: 'File size must be between 1B and 25MB' })
      return
    }
    setSelectedFile(file)
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
  }

  const handleDownload = async (material: StudyMaterial) => {
    try {
      const blob = await fetchMaterialBlob(material.id, 'download')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = material.file_name || material.title
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      toast.error('Download failed', { description: message })
    }
  }

  const handleView = async (material: StudyMaterial) => {
    setPreviewMaterial(material)
    setPreviewOpen(true)

    if (!isPdf(material.mime_type, material.file_name)) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    setPreviewLoading(true)
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      const blob = await fetchMaterialBlob(material.id, 'view')
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Preview failed'
      toast.error('Preview failed', { description: message })
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
            Study Materials
          </h1>
          <p className="text-muted-foreground mt-1">Upload and manage super admin study materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            <BookOpen className="h-4 w-4 mr-2" />
            {materials.length} Materials
          </Badge>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Material
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center mb-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" placeholder="Search by title, file name or description" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 xl:w-auto">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectOptions.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><GraduationCap className="h-4 w-4 mr-2" /><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((cls) => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Material</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading materials...</TableCell></TableRow>
                ) : materials.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12"><FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No materials found</p></TableCell></TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell><div className="min-w-0"><p className="font-medium truncate">{material.title || material.file_name}</p><p className="text-xs text-muted-foreground truncate">{material.file_name}</p></div></TableCell>
                      <TableCell>{material.uploader_name || 'Super Admin'}</TableCell>
                      <TableCell><Badge variant="outline">{material.subject}</Badge></TableCell>
                      <TableCell>{material.class_level}</TableCell>
                      <TableCell>{new Date(material.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell>{formatFileSize(material.file_size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(material)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(material)}><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" disabled={deleteMutation.isPending} onClick={() => { const ok = window.confirm(`Delete \"${material.title || material.file_name}\"?`); if (ok) deleteMutation.mutate(material.id) }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground text-sm gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading next 20 rows...</div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Study Material</DialogTitle>
            <DialogDescription>Share study materials for catalog classes and subjects.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="superadmin-material-title">Title</Label>
              <Input id="superadmin-material-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Class 10 Physics Notes" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classOptions.map((cls) => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjectOptions.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="superadmin-material-description">Description (Optional)</Label>
              <Textarea id="superadmin-material-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the material" rows={3} />
            </div>

            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,video/mp4" onChange={(e) => { const file = e.target.files?.[0]; if (file) validateAndSetFile(file) }} />

            <div className="rounded-lg border border-dashed p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">Allowed: {ACCEPTED_EXTENSIONS.join(', ').toUpperCase()} | Max 25MB</div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Choose File</Button>
              </div>
              {selectedFile ? (
                <div className="mt-3 flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3 min-w-0"><File className="h-5 w-5 text-blue-600" /><div className="min-w-0"><p className="text-sm font-medium truncate">{selectedFile.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p></div></div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}><X className="h-4 w-4" /></Button>
                </div>
              ) : null}
            </div>

            <Button className="w-full" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !title.trim() || !selectedClass || !selectedSubject || !selectedFile}>
              {uploadMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Study Material</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={(open) => {
        setPreviewOpen(open)
        if (!open) {
          setPreviewMaterial(null)
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
          }
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewMaterial?.title || previewMaterial?.file_name || 'Material Preview'}</DialogTitle>
            <DialogDescription>Preview metadata and document details</DialogDescription>
          </DialogHeader>
          {previewMaterial ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">File name:</span> {previewMaterial.file_name}</div>
                <div><span className="text-muted-foreground">Type:</span> {previewMaterial.mime_type || 'unknown'}</div>
                <div><span className="text-muted-foreground">Size:</span> {formatFileSize(previewMaterial.file_size)}</div>
                <div><span className="text-muted-foreground">Uploaded by:</span> {previewMaterial.uploader_name || 'Super Admin'}</div>
                <div><span className="text-muted-foreground">Subject:</span> {previewMaterial.subject}</div>
                <div><span className="text-muted-foreground">Class:</span> {previewMaterial.class_level}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Uploaded at:</span> {new Date(previewMaterial.uploaded_at).toLocaleString()}</div>
              </div>

              {isPdf(previewMaterial.mime_type, previewMaterial.file_name) ? (
                <div className="border rounded-md overflow-hidden h-[65vh] bg-muted/20">
                  {previewLoading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading preview...</div>
                  ) : previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full" title="Material Preview" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Preview unavailable</div>
                  )}
                </div>
              ) : (
                <div className="border rounded-md p-4 md:p-6 text-sm text-muted-foreground">Inline preview is available only for PDF files. Use download for this material.</div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SuperAdminMaterialsForm

