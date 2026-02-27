"use client"

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search, FileText, Video, Link as LinkIcon, Download, Eye, BookOpen, FolderOpen,
  Filter, Clock, ExternalLink, PlayCircle, Loader2, GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'

interface StudentMaterial {
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

interface StudentMaterialsPage {
  materials: StudentMaterial[]
  page: number
  page_size: number
  has_more: boolean
  next_page: number
  order: string
}

const STORAGE_KEYS = {
  TOKEN: 'School24_token',
  REMEMBER: 'School24_remember',
} as const

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
  const primary = remembered ? localStorage : sessionStorage
  return (
    primary.getItem(STORAGE_KEYS.TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN)
  )
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

function getMaterialType(mimeType: string, fileName: string): 'pdf' | 'video' | 'link' | 'doc' {
  const mime = (mimeType || '').toLowerCase()
  const name = (fileName || '').toLowerCase()
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (mime.startsWith('video/') || name.endsWith('.mp4')) return 'video'
  if (mime.startsWith('text/html') || name.endsWith('.url')) return 'link'
  return 'doc'
}

function getSourceLabel(role?: string): { label: string; className: string } {
  const r = (role || '').toLowerCase()
  if (r === 'super_admin' || r === 'superadmin' || r === 'super admin' || r === 'admin') {
    return {
      label: 'Platform',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    }
  }
  return {
    label: 'Teacher',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700',
  }
}

export default function StudentMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState<StudentMaterial | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Debounce search so we don't hammer the backend on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: ['student-materials', 'desc', selectedSubject, debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('page_size', '20')
      params.set('order', 'desc')
      if (selectedSubject !== 'all') params.set('subject', selectedSubject)
      if (debouncedSearch) params.set('search', debouncedSearch)
      return api.get<StudentMaterialsPage>(`/student/materials?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_page : undefined),
  })

  // Infinite scroll — fetch next page when near bottom
  useEffect(() => {
    const onScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return
      const el = document.documentElement
      if (window.scrollY + window.innerHeight >= el.scrollHeight * 0.8) fetchNextPage()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const materials = useMemo(() => data?.pages.flatMap((p) => p.materials) || [], [data])

  // Subject filter pills derived from loaded pages (grows as user scrolls)
  const subjects = useMemo(() => {
    const set = new Set<string>()
    for (const material of materials) {
      const subject = (material.subject || '').trim()
      if (subject) set.add(subject)
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [materials])

  const fetchMaterialBlob = async (id: string, mode: 'view' | 'download') => {
    const token = getToken()
    if (!token) throw new Error('Session expired. Please login again.')

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${baseUrl}/student/materials/${id}/${mode}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || err.message || `Request failed (${response.status})`)
    }
    return response.blob()
  }

  const handleDownloadMaterial = async (material: StudentMaterial) => {
    try {
      const blob = await fetchMaterialBlob(material.id, 'download')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = material.file_name || material.title
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unable to download file',
      })
    }
  }

  const handleViewMaterial = async (material: StudentMaterial) => {
    setPreviewMaterial(material)
    setPreviewOpen(true)
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
      toast.error('Preview failed', {
        description: error instanceof Error ? error.message : 'Unable to open preview',
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const getTypeIcon = (type: 'pdf' | 'video' | 'link' | 'doc') => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6" />
      case 'video':
        return <Video className="h-6 w-6" />
      case 'link':
        return <LinkIcon className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const getTypeColor = (type: 'pdf' | 'video' | 'link' | 'doc') => {
    switch (type) {
      case 'pdf':
        return 'from-red-500 to-rose-600'
      case 'video':
        return 'from-blue-500 to-cyan-600'
      case 'link':
        return 'from-violet-500 to-purple-600'
      default:
        return 'from-green-500 to-emerald-600'
    }
  }

  const getTypeBg = (type: 'pdf' | 'video' | 'link' | 'doc') => {
    switch (type) {
      case 'pdf':
        return 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 hover:border-red-300'
      case 'video':
        return 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:border-blue-300'
      case 'link':
        return 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 hover:border-violet-300'
      default:
        return 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:border-green-300'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Study Materials
          </h1>
          <p className="text-muted-foreground">Access your class study materials and resources</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-blue-700 dark:text-blue-400">{materials.length}</p>
                <p className="text-sm text-muted-foreground">Loaded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-red-700 dark:text-red-400">
                  {materials.filter((m) => getMaterialType(m.mime_type, m.file_name) === 'pdf').length}
                </p>
                <p className="text-sm text-muted-foreground">PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
                <Video className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-violet-700 dark:text-violet-400">
                  {materials.filter((m) => getMaterialType(m.mime_type, m.file_name) === 'video').length}
                </p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30">
                <FolderOpen className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-400">{Math.max(subjects.length - 1, 0)}</p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {subjects.map((subject) => {
                const value = subject === 'All' ? 'all' : subject
                const active = selectedSubject === value
                return (
                  <Button
                    key={subject}
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject(value)}
                    className={`rounded-full px-4 ${active ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0' : ''}`}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    {subject}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {queryError && (
        <Card className="border-0 shadow-lg border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-1">Failed to load materials</h3>
            <p className="text-sm text-red-600 dark:text-red-400">{queryError instanceof Error ? queryError.message : 'An unknown error occurred'}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            Loading materials...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material, index) => {
            const type = getMaterialType(material.mime_type, material.file_name)
            const source = getSourceLabel(material.uploader_role)
            return (
              <Card
                key={material.id}
                className={`border-2 border-transparent transition-all duration-300 hover:shadow-xl bg-gradient-to-br ${getTypeBg(type)} stagger-${(index % 5) + 1} animate-slide-up cursor-pointer`}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getTypeColor(type)} text-white shadow-lg`}>
                      {getTypeIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-tight line-clamp-2">{material.title || material.file_name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{material.subject}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={type === 'pdf' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        type === 'video' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'}
                    >
                      {type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${source.className}`}>
                      {source.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{formatFileSize(material.file_size)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate max-w-[55%]">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{material.uploader_name || material.teacher_name || '—'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
                      onClick={() => handleViewMaterial(material)}
                    >
                      {type === 'video' ? (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      ) : type === 'link' ? (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMaterial(material)}
                      className="hover:bg-green-100 hover:text-green-700 hover:border-green-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !queryError && materials.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No materials found</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || selectedSubject !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No study materials have been uploaded for your class yet'}
            </p>
            {(debouncedSearch || selectedSubject !== 'all') && (
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedSubject('all') }}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) {
            setPreviewMaterial(null)
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }
          }
        }}
      >
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
                <div>
                  <span className="text-muted-foreground">Source: </span>
                  <Badge variant="outline" className={`text-xs ml-1 ${getSourceLabel(previewMaterial.uploader_role).className}`}>
                    {getSourceLabel(previewMaterial.uploader_role).label}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">Uploaded by:</span> {previewMaterial.uploader_name || previewMaterial.teacher_name || '—'}</div>
                <div><span className="text-muted-foreground">Subject:</span> {previewMaterial.subject}</div>
                <div><span className="text-muted-foreground">Class:</span> {previewMaterial.class_level}</div>
                <div><span className="text-muted-foreground">Uploaded at:</span> {new Date(previewMaterial.uploaded_at).toLocaleString()}</div>
                {previewMaterial.description ? (
                  <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {previewMaterial.description}</div>
                ) : null}
              </div>

              {isPdf(previewMaterial.mime_type, previewMaterial.file_name) ? (
                <div className="border rounded-md overflow-hidden h-[65vh] bg-muted/20">
                  {previewLoading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading preview...
                    </div>
                  ) : previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full" title="Material Preview" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Preview unavailable
                    </div>
                  )}
                </div>
              ) : previewMaterial.mime_type.toLowerCase().startsWith('video/') && previewUrl ? (
                <div className="border rounded-md overflow-hidden h-[65vh] bg-black/90">
                  <video src={previewUrl} controls className="w-full h-full" />
                </div>
              ) : (
                <div className="border rounded-md p-4 md:p-6 text-sm text-muted-foreground">
                  Inline preview is available for PDF/video files. Use download for this material type.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

