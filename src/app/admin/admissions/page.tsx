"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Image as ImageIcon,
  Search,
  Printer,
  Loader2,
  Copy,
  ExternalLink,
  Settings,
  Users,
  Clock,
  CheckCheck,
  GraduationCap,
  CircleDot,
  BookOpen,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdmissionListItem {
  id: string
  student_name: string
  date_of_birth: string
  mother_phone: string
  applying_for_class?: string
  document_count: number
  status: "pending" | "under_review" | "approved" | "rejected"
  submitted_at: string
}

interface AdmissionApplication extends AdmissionListItem {
  school_id: string
  gender?: string
  religion?: string
  caste_category?: string
  nationality?: string
  blood_group?: string
  aadhaar_number?: string
  father_name?: string
  father_phone?: string
  mother_name?: string
  mother_occupation?: string
  father_occupation?: string
  guardian_name?: string
  guardian_phone?: string
  address_line1?: string
  city?: string
  state?: string
  pincode?: string
  previous_school_name?: string
  previous_class?: string
  has_birth_certificate: boolean
  has_aadhaar_card: boolean
  has_transfer_certificate: boolean
  has_caste_certificate: boolean
  has_income_certificate: boolean
  has_passport_photo: boolean
  rejection_reason?: string
}

interface AdmissionSettings {
  admissions_open: boolean
  auto_approve: boolean
  global_academic_year: string
  school_slug: string
  school_name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:      { label: "Pending",      bg: "bg-amber-50 text-amber-700 border border-amber-200",   dot: "bg-amber-400" },
  under_review: { label: "Under Review", bg: "bg-blue-50 text-blue-700 border border-blue-200",      dot: "bg-blue-500" },
  approved:     { label: "Approved",     bg: "bg-green-50 text-green-700 border border-green-200",   dot: "bg-green-500" },
  rejected:     { label: "Rejected",     bg: "bg-red-50 text-red-700 border border-red-200",         dot: "bg-red-400" },
} as const

const DOC_FLAGS: { key: keyof AdmissionApplication; label: string }[] = [
  { key: "has_birth_certificate",    label: "Birth Certificate" },
  { key: "has_aadhaar_card",         label: "Aadhaar Card" },
  { key: "has_transfer_certificate", label: "Transfer Certificate" },
  { key: "has_caste_certificate",    label: "Caste Certificate" },
  { key: "has_income_certificate",   label: "Income Certificate" },
  { key: "has_passport_photo",       label: "Passport Photo" },
]

const STATUS_TABS = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending" },
  { key: "under_review", label: "Under Review" },
  { key: "approved",     label: "Approved" },
  { key: "rejected",     label: "Rejected" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAdmissionsPage() {
  const queryClient = useQueryClient()

  // ── Real-time WebSocket: invalidate queries on new admission  ─────────────
  const wsRef    = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)
  const MAX_RETRY = 5

  useEffect(() => {
    function getToken() {
      if (typeof window === "undefined") return null
      const remembered = localStorage.getItem("School24_remember") === "true"
      const primary = remembered ? localStorage : sessionStorage
      return (
        primary.getItem("School24_token") ||
        localStorage.getItem("School24_token") ||
        sessionStorage.getItem("School24_token")
      )
    }

    function connect() {
      const token = getToken()
      if (!token) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const wsBase = apiUrl.replace(/^http/, "ws")
      const url = `${wsBase}/api/v1/admin/admissions/ws?token=${encodeURIComponent(token)}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as { type: string }
          if (data.type === "new_admission") {
            // Invalidate all admission-related queries so counts + list refresh
            queryClient.invalidateQueries({ queryKey: ["admin-admissions"] })
            queryClient.invalidateQueries({ queryKey: ["adm-count"] })
            queryClient.invalidateQueries({ queryKey: ["admin-admissions-pending-count"] })
          }
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (retryCount.current < MAX_RETRY) {
          const delay = Math.min(1_000 * 2 ** retryCount.current, 15_000)
          retryCount.current += 1
          retryRef.current = setTimeout(connect, delay)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    retryCount.current = 0
    connect()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [queryClient])

  // Local state
  const [statusTab, setStatusTab]           = useState("all")
  const [search, setSearch]                 = useState("")
  const [page, setPage]                     = useState(1)
  const [settingsOpen, setSettingsOpen]     = useState(false)
  const [detailOpen, setDetailOpen]         = useState(false)
  const [rejectOpen, setRejectOpen]         = useState(false)
  const [rejectReason, setRejectReason]     = useState("")
  const [selectedApp, setSelectedApp]       = useState<AdmissionListItem | null>(null)

  // Settings draft state (controlled inside the dialog)
  const [draftOpen, setDraftOpen]           = useState(false)
  const [draftAutoApprove, setDraftAutoApprove] = useState(false)

  // ── Queries
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-admission-settings"],
    queryFn: () => api.get<AdmissionSettings>("/admin/settings/admissions"),
  })

  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-admissions", statusTab, page],
    queryFn: () =>
      api.get<{ items: AdmissionListItem[]; total: number }>(
        `/admin/admissions?${statusTab !== "all" ? `status=${statusTab}&` : ""}page=${page}&page_size=20`
      ),
  })

  const cAll      = useQuery({ queryKey: ["adm-count", "all"],          queryFn: () => api.get<{ total: number }>("/admin/admissions?page=1&page_size=1"),                      staleTime: 30000 })
  const cPending  = useQuery({ queryKey: ["adm-count", "pending"],      queryFn: () => api.get<{ total: number }>("/admin/admissions?status=pending&page=1&page_size=1"),       staleTime: 30000 })
  const cReview   = useQuery({ queryKey: ["adm-count", "under_review"], queryFn: () => api.get<{ total: number }>("/admin/admissions?status=under_review&page=1&page_size=1"), staleTime: 30000 })
  const cApproved = useQuery({ queryKey: ["adm-count", "approved"],     queryFn: () => api.get<{ total: number }>("/admin/admissions?status=approved&page=1&page_size=1"),      staleTime: 30000 })
  const cRejected = useQuery({ queryKey: ["adm-count", "rejected"],     queryFn: () => api.get<{ total: number }>("/admin/admissions?status=rejected&page=1&page_size=1"),      staleTime: 30000 })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-admission-detail", selectedApp?.id],
    queryFn: () => api.get<AdmissionApplication>(`/admin/admissions/${selectedApp!.id}`),
    enabled: !!selectedApp && detailOpen,
  })

  // ── Mutations
  const settingsMutation = useMutation({
    mutationFn: (payload: { admissions_open: boolean; auto_approve: boolean }) =>
      api.put("/admin/settings/admissions", payload),
    onSuccess: (_data: unknown, payload: { admissions_open: boolean; auto_approve: boolean }) => {
      toast.success(payload.admissions_open ? "Admissions opened." : "Admissions closed.")
      queryClient.invalidateQueries({ queryKey: ["admin-admission-settings"] })
      setSettingsOpen(false)
    },
    onError: () => toast.error("Failed to save settings"),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/admissions/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Approved — student account created.")
      queryClient.invalidateQueries({ queryKey: ["admin-admissions"] })
      queryClient.invalidateQueries({ queryKey: ["adm-count"] })
      setDetailOpen(false)
    },
    onError: (e: Error) => toast.error(e.message || "Approval failed"),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/admin/admissions/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Application rejected.")
      queryClient.invalidateQueries({ queryKey: ["admin-admissions"] })
      queryClient.invalidateQueries({ queryKey: ["adm-count"] })
      setRejectOpen(false)
      setDetailOpen(false)
      setRejectReason("")
    },
    onError: (e: Error) => toast.error(e.message || "Rejection failed"),
  })

  // ── Helpers
  const items = listData?.items ?? []
  const filtered = search.trim()
    ? items.filter(
        (a) =>
          a.student_name.toLowerCase().includes(search.toLowerCase()) ||
          a.mother_phone.includes(search)
      )
    : items

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dash.schools24.in"
  const portalUrl = settings?.school_slug ? `${appBaseUrl}/admission/${settings.school_slug}` : ""

  // ── Portal URL liveness ping (HEAD request, 2-min staleTime, no polling)
  const { data: pingResult, isFetching: pingFetching } = useQuery<boolean>({
    queryKey: ["portal-ping", portalUrl],
    queryFn: async () => {
      try {
        const res = await fetch(portalUrl, { method: "HEAD", cache: "no-store" })
        return res.ok
      } catch {
        return false
      }
    },
    enabled: !!portalUrl,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const pingDot = pingFetching
    ? "bg-gray-300 animate-pulse"
    : pingResult
    ? "bg-green-500"
    : "bg-red-400"
  const pingLabel = pingFetching ? "Checking\u2026" : pingResult ? portalUrl : "Unreachable"

  const copyPortalUrl = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl).then(() => toast.success("Link copied!"))
  }

  const openSettings = () => {
    setDraftOpen(settings?.admissions_open ?? false)
    setDraftAutoApprove(settings?.auto_approve ?? false)
    setSettingsOpen(true)
  }

  const printApp = useCallback(() => {
    const app = detailData
    if (!app) return
    const docList = DOC_FLAGS.filter(({ key }) => app[key])
      .map(({ label }) => `<li>${label}</li>`).join("")
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`<html><head><title>Admission — ${app.student_name}</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;margin:32px;color:#111}
    h2{margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:12px}
    th{text-align:left;background:#f5f5f5;padding:5px 9px;font-size:11px;text-transform:uppercase}
    td{padding:6px 9px;border-bottom:1px solid #eee}.lbl{color:#888;font-size:10px;text-transform:uppercase}
    @media print{@page{margin:20mm}}</style></head><body>
    <h2>Admission Application — ${app.student_name}</h2>
    <p style="color:#666;font-size:12px">Ref: ${app.id} &nbsp;|&nbsp; ${format(new Date(app.submitted_at), "dd MMM yyyy")} &nbsp;|&nbsp; ${STATUS_CFG[app.status]?.label}</p>
    <table>
      <tr><th>Field</th><th>Value</th></tr>
      <tr><td>Name</td><td>${app.student_name}</td></tr>
      <tr><td>DOB</td><td>${app.date_of_birth}</td></tr>
      <tr><td>Gender</td><td>${app.gender ?? "—"}</td></tr>
      <tr><td>Class</td><td>${app.applying_for_class ?? "—"}</td></tr>
      <tr><td>Father</td><td>${app.father_name ?? "—"} ${app.father_phone ?? ""}</td></tr>
      <tr><td>Mother</td><td>${app.mother_name ?? "—"} ${app.mother_phone}</td></tr>
    </table>
    <p style="margin-top:16px;font-weight:600">Documents</p><ul>${docList || "<li>None</li>"}</ul>
    </body></html>`)
    w.document.close()
    w.focus()
    w.print()
    w.onafterprint = () => w.close()
  }, [detailData])

  const statItems = [
    { key: "all",          label: "All",          count: cAll.data?.total ?? 0,      icon: <Users      className="h-4 w-4" /> },
    { key: "pending",      label: "Pending",      count: cPending.data?.total ?? 0,  icon: <Clock      className="h-4 w-4" /> },
    { key: "under_review", label: "Under Review", count: cReview.data?.total ?? 0,   icon: <CircleDot  className="h-4 w-4" /> },
    { key: "approved",     label: "Approved",     count: cApproved.data?.total ?? 0, icon: <CheckCheck className="h-4 w-4" /> },
    { key: "rejected",     label: "Rejected",     count: cRejected.data?.total ?? 0, icon: <XCircle    className="h-4 w-4" /> },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="border-b bg-background px-6 py-4 flex items-start justify-between gap-4">
        {/* Left: title + URL subrow */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0" />
            <h1 className="text-lg font-semibold truncate">Admissions</h1>
            {settings?.global_academic_year && (
              <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs shrink-0">
                <BookOpen className="h-3 w-3" /> {settings.global_academic_year}
              </Badge>
            )}
            {!settingsLoading && (
              <span
                className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  settings?.admissions_open ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${settings?.admissions_open ? "bg-green-500" : "bg-gray-400"}`} />
                {settings?.admissions_open ? "Open" : "Closed"}
              </span>
            )}
          </div>

          {/* Portal subrow — status + Copy + Open */}
          {portalUrl && (
            <div className="flex items-center gap-2 pl-8">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${pingDot}`}
                title={pingLabel}
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[240px] sm:max-w-sm md:max-w-md">{pingLabel}</span>
              <button
                onClick={copyPortalUrl}
                className="shrink-0 text-[11px] font-medium text-muted-foreground border rounded px-2 py-0.5 hover:bg-muted transition-colors"
              >
                Copy
              </button>
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[11px] font-medium text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/5 transition-colors"
              >
                Preview
              </a>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="gap-2 shrink-0 mt-0.5" onClick={openSettings}>
          <Settings className="h-4 w-4" /> Settings
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* ── STATS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {statItems.map(({ key, label, count, icon }) => (
            <button
              key={key}
              onClick={() => { setStatusTab(key); setPage(1) }}
              className={`flex flex-col items-center gap-0.5 rounded-xl border p-3 text-center transition-all ${
                statusTab === key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <span className={statusTab === key ? "text-primary" : "text-muted-foreground"}>{icon}</span>
              <span className={`text-xl font-bold ${statusTab === key ? "text-primary" : "text-foreground"}`}>{count}</span>
              <span className={`text-[11px] font-medium leading-tight ${statusTab === key ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── SEARCH + FILTER TABS ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setStatusTab(key); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusTab === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABLE ──────────────────────────────────────────────────── */}
        <Card className="border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wide text-gray-500">Student</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wide text-gray-500">DOB</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500">Phone</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wide text-gray-500">Class</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wide text-gray-500">Docs</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500">Status</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wide text-gray-500">Date</TableHead>
                <TableHead className="pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-300" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <p className="text-sm text-gray-400">No applications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((app) => {
                  const cfg = STATUS_CFG[app.status]
                  const initials = app.student_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <TableRow
                      key={app.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => { setSelectedApp(app); setDetailOpen(true) }}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {initials}
                          </div>
                          <span className="font-medium text-sm">{app.student_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-500">{app.date_of_birth}</TableCell>
                      <TableCell className="text-sm text-gray-600">{app.mother_phone}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">{app.applying_for_class ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          <FileText className="h-3 w-3" /> {app.document_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-400">
                        {format(new Date(app.submitted_at), "dd MMM yy")}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Eye className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {listData && listData.total > 20 && (
            <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-gray-500">
              <span>{(page - 1) * 20 + 1}–{Math.min(page * 20, listData.total)} of {listData.total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= listData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── SETTINGS DIALOG ────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" /> Admission Settings
            </DialogTitle>
            <DialogDescription>
              {settings?.school_name} &mdash; {settings?.global_academic_year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Portal link */}
            {settings?.school_slug && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Admission Portal URL</p>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-1 overflow-x-auto min-w-0">
                    <code className="text-xs whitespace-nowrap">{portalUrl}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyPortalUrl} className="h-7 px-2 shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <a href={portalUrl} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Toggle: Admissions Open */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Accept Applications</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {draftOpen ? (
                    <span className="text-green-600 font-medium">● Admissions are OPEN</span>
                  ) : (
                    <span className="text-gray-400">○ Admissions are CLOSED</span>
                  )}
                </p>
              </div>
              <Switch
                checked={draftOpen}
                onCheckedChange={setDraftOpen}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Toggle: Auto-Approve */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Auto-Accept Applications</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically approve &amp; create student accounts on submission
                </p>
              </div>
              <Switch
                checked={draftAutoApprove}
                onCheckedChange={setDraftAutoApprove}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button
              disabled={settingsMutation.isPending}
              onClick={() => settingsMutation.mutate({ admissions_open: draftOpen, auto_approve: draftAutoApprove })}
            >
              {settingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DETAIL DIALOG ──────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedApp(null) }}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Application — {selectedApp?.student_name}
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedApp && format(new Date(selectedApp.submitted_at), "dd MMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : detailData ? (
            <div className="space-y-5 text-sm">
              {/* Status */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CFG[detailData.status]?.bg ?? ""}`}>
                  <span className={`h-2 w-2 rounded-full ${STATUS_CFG[detailData.status]?.dot ?? ""}`} />
                  {STATUS_CFG[detailData.status]?.label ?? detailData.status}
                </span>
                {detailData.rejection_reason && (
                  <span className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-red-700 text-xs">
                    {detailData.rejection_reason}
                  </span>
                )}
              </div>

              <DSec title="Student">
                <DGrid>
                  <DRow label="Full Name"       value={detailData.student_name} />
                  <DRow label="Date of Birth"   value={detailData.date_of_birth} />
                  <DRow label="Gender"          value={detailData.gender} />
                  <DRow label="Blood Group"     value={detailData.blood_group} />
                  <DRow label="Nationality"     value={detailData.nationality} />
                  <DRow label="Aadhaar"         value={detailData.aadhaar_number} />
                  <DRow label="Religion"        value={detailData.religion} />
                  <DRow label="Caste Category"  value={detailData.caste_category} />
                  <DRow label="Applying For"    value={detailData.applying_for_class} />
                </DGrid>
              </DSec>

              <DSec title="Parents / Guardian">
                <DGrid>
                  <DRow label="Father's Name"       value={detailData.father_name} />
                  <DRow label="Father's Phone"      value={detailData.father_phone} />
                  <DRow label="Father's Occupation" value={detailData.father_occupation} />
                  <DRow label="Mother's Name"       value={detailData.mother_name} />
                  <DRow label="Mother's Phone"      value={detailData.mother_phone} />
                  <DRow label="Mother's Occupation" value={detailData.mother_occupation} />
                  <DRow label="Guardian"            value={detailData.guardian_name} />
                  <DRow label="Guardian Phone"      value={detailData.guardian_phone} />
                </DGrid>
              </DSec>

              {detailData.address_line1 && (
                <DSec title="Address">
                  <p className="text-gray-700">
                    {[detailData.address_line1, detailData.city, detailData.state, detailData.pincode].filter(Boolean).join(", ")}
                  </p>
                </DSec>
              )}

              {detailData.previous_school_name && (
                <DSec title="Previous School">
                  <DGrid>
                    <DRow label="School"          value={detailData.previous_school_name} />
                    <DRow label="Class Completed" value={detailData.previous_class} />
                  </DGrid>
                </DSec>
              )}

              <DSec title="Documents">
                <div className="flex flex-wrap gap-2">
                  {DOC_FLAGS.map(({ key, label }) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className={`gap-1 text-xs ${
                        detailData[key]
                          ? "bg-green-50 text-green-700 border-green-200 border"
                          : "bg-gray-50 text-gray-400 border border-gray-200 opacity-60 line-through"
                      }`}
                    >
                      {label.toLowerCase().includes("photo") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {label}
                    </Badge>
                  ))}
                </div>
              </DSec>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-3 mt-2">
            <Button variant="outline" size="sm" onClick={printApp} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <div className="flex-1" />
            {detailData && (detailData.status === "pending" || detailData.status === "under_review") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                  onClick={() => setRejectOpen(true)}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(detailData.id)}
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REJECT DIALOG ──────────────────────────────────────────── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Reject Application
            </DialogTitle>
            <DialogDescription>Provide a reason. Documents will be deleted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="e.g. Documents incomplete, age criteria not met…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => selectedApp && rejectMutation.mutate({ id: selectedApp.id, reason: rejectReason })}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
      {children}
    </div>
  )
}

function DGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">{children}</div>
}

function DRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium">{value || "—"}</p>
    </div>
  )
}
