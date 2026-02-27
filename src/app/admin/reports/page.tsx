"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  BarChart3,
  Users,
  DollarSign,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useClasses } from "@/hooks/useClasses";
import { useAdminRevenueChart, useAdminWeeklyAttendance, useAdminClassDistribution } from "@/hooks/useAdminDashboardSections";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const ASSESSMENT_TYPES = [
  "FA-1", "SA-1",
  "FA-2", "SA-2",
  "FA-3", "SA-3",
  "FA-4", "SA-4",
] as const;

const normalizeAssessmentType = (value: string | undefined | null): string =>
  ASSESSMENT_TYPES.includes(value as (typeof ASSESSMENT_TYPES)[number])
    ? (value as string)
    : "FA-1";

interface AssessmentSubjectMark {
  id?: string;
  subject_name?: string;
  subject_label?: string;
  total_marks: number;
  breakdowns: AssessmentMarkBreakdown[];
}

interface AssessmentMarkBreakdown {
  id?: string;
  title: string;
  marks: number;
}

interface AssessmentItem {
  id: string;
  name: string;
  assessment_type: string;
  class_name?: string;
  class_grades?: number[];
  class_labels?: string[];
  scheduled_date?: string;
  academic_year: string;
  total_marks: number;
  subject_marks: AssessmentSubjectMark[];
}

interface AssessmentFormState {
  name: string;
  assessment_type: string;
  class_grades: number[];
  scheduled_date: string;
  subject_marks: AssessmentSubjectMark[];
}

interface ExamTimetableSubjectOption {
  class_id: string;
  subject_id: string;
  name: string;
  code: string;
}

interface ExamTimetableEntry {
  id: string;
  subject_id: string;
  subject: string;
  exam_date: string;
}

interface ExamTimetableResponse {
  class_name: string;
  subjects: ExamTimetableSubjectOption[];
  entries: ExamTimetableEntry[];
}

const emptyForm = (): AssessmentFormState => ({
  name: "",
  assessment_type: "FA-1",
  class_grades: [],
  scheduled_date: "",
  subject_marks: [{ total_marks: 0, breakdowns: [] }],
});

const singleSubject = (
  subjectMarks?: AssessmentSubjectMark[],
): AssessmentSubjectMark[] => {
  if (!subjectMarks || subjectMarks.length === 0) {
    return [{ total_marks: 0, breakdowns: [] }];
  }
  const first = subjectMarks[0];
  return [
    {
      ...first,
      total_marks: Number(first.total_marks || 0),
      breakdowns: (first.breakdowns || []).map((b) => ({
        id: b.id,
        title: b.title,
        marks: Number(b.marks || 0),
      })),
    },
  ];
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  if (now.getMonth() + 1 < 4) return `${y - 1}-${y}`;
  return `${y}-${y + 1}`;
};

const getAcademicYearOptions = () => {
  const y = new Date().getFullYear();
  const items: string[] = [];
  for (let i = 0; i < 11; i += 1) {
    const start = y - i;
    items.push(`${start}-${start + 1}`);
  }
  return items;
};

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [isAssessmentFormOpen, setIsAssessmentFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentItem | null>(null);
  const [form, setForm] = useState<AssessmentFormState>(emptyForm());
  const [examDateBySubject, setExamDateBySubject] = useState<
    Record<string, string>
  >({});

  const { data: classesData } = useClasses(selectedYear);

  const classGradeOptions = useMemo(() => {
    const byGrade = new Map<number, string>();
    const sorted = [...(classesData?.classes || [])].sort(
      (a, b) => a.grade - b.grade,
    );
    sorted.forEach((item) => {
      if (!byGrade.has(item.grade)) {
        let label = `Class ${item.grade}`;
        if (item.grade === -1) label = "LKG";
        if (item.grade === 0) label = "UKG";
        byGrade.set(item.grade, label);
      }
    });
    return Array.from(byGrade.entries()).map(([grade, label]) => ({
      grade,
      label,
    }));
  }, [classesData?.classes]);

  const assessmentsQuery = useQuery({
    queryKey: ["admin-assessments", selectedYear],
    queryFn: () =>
      api.get<{ assessments: AssessmentItem[] }>(
        `/admin/assessments?academic_year=${selectedYear}`,
      ),
  });
  const assessments = assessmentsQuery.data?.assessments || [];
  const selectedSingleClassGrade =
    form.class_grades.length === 1 ? form.class_grades[0] : null;

  // Real chart data
  const { data: revenueChartResp } = useAdminRevenueChart('month')
  const revenueChartData = revenueChartResp?.data ?? []

  const { data: weeklyAttendanceResp } = useAdminWeeklyAttendance()
  const attendanceChartData = weeklyAttendanceResp?.days ?? []

  const { data: classDistResp } = useAdminClassDistribution()
  const gradeDistribution = (classDistResp?.items ?? []).map(item => ({
    name: item.name,
    value: item.student_count,
  }))

  const examTimetableQuery = useQuery({
    queryKey: [
      "assessment-exam-timetable",
      editingAssessment?.id,
      selectedSingleClassGrade,
    ],
    enabled: !!editingAssessment?.id && selectedSingleClassGrade !== null,
    queryFn: () =>
      api.get<ExamTimetableResponse>(
        `/admin/assessments/${editingAssessment?.id}/exam-timetable?class_grade=${selectedSingleClassGrade}`,
      ),
  });

  const examTimetableMutation = useMutation({
    mutationFn: () => {
      if (!editingAssessment?.id || selectedSingleClassGrade === null) {
        throw new Error("Select exactly one class and edit an assessment first");
      }
      const subjects = examTimetableQuery.data?.subjects || [];
      const entries = subjects
        .map((subject) => ({
          subject_id: subject.subject_id,
          exam_date: examDateBySubject[subject.subject_id],
        }))
        .filter((entry) => entry.exam_date);

      if (entries.length === 0) {
        throw new Error("Select at least one exam date");
      }

      return api.put(`/admin/assessments/${editingAssessment.id}/exam-timetable`, {
        class_grade: selectedSingleClassGrade,
        entries,
      });
    },
    onSuccess: () => {
      toast.success("Exam timetable updated");
      queryClient.invalidateQueries({
        queryKey: ["assessment-exam-timetable", editingAssessment?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to update exam timetable", {
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const totalFormMarks = useMemo(
    () =>
      form.subject_marks.reduce(
        (sum, item) => sum + Number(item.total_marks || 0),
        0,
      ),
    [form.subject_marks],
  );

  const handleExportAll = () => {
    toast.success("Exporting all reports", {
      description: `Generating reports for ${selectedYear}...`,
    });
    setTimeout(() => {
      toast.success("Export completed", {
        description: "All reports have been downloaded.",
      });
    }, 1500);
  };

  const createAssessmentMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/assessments", {
        ...form,
        academic_year: selectedYear,
        subject_marks: singleSubject(form.subject_marks).map((item) => ({
          total_marks: Number(item.total_marks || 0),
          breakdowns: (item.breakdowns || []).map((breakdown) => ({
            title: breakdown.title,
            marks: Number(breakdown.marks || 0),
          })),
        })),
      }),
    onSuccess: () => {
      toast.success("Assessment created");
      setIsAssessmentFormOpen(false);
      setForm(emptyForm());
      queryClient.invalidateQueries({ queryKey: ["admin-assessments"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to create assessment", {
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/assessments/${editingAssessment?.id}`, {
        ...form,
        academic_year: selectedYear,
        subject_marks: singleSubject(form.subject_marks).map((item) => ({
          total_marks: Number(item.total_marks || 0),
          breakdowns: (item.breakdowns || []).map((breakdown) => ({
            title: breakdown.title,
            marks: Number(breakdown.marks || 0),
          })),
        })),
      }),
    onSuccess: () => {
      toast.success("Assessment updated");
      setIsAssessmentFormOpen(false);
      setEditingAssessment(null);
      setForm(emptyForm());
      queryClient.invalidateQueries({ queryKey: ["admin-assessments"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to update assessment", {
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentID: string) =>
      api.delete(`/admin/assessments/${assessmentID}`),
    onSuccess: () => {
      toast.success("Assessment deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-assessments"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to delete assessment", {
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const openCreateAssessment = () => {
    setEditingAssessment(null);
    setForm(emptyForm());
    setExamDateBySubject({});
    setIsAssessmentFormOpen(true);
  };

  const openEditAssessment = (item: AssessmentItem) => {
    setEditingAssessment(item);
    setForm({
      name: item.name || "",
      assessment_type: normalizeAssessmentType(item.assessment_type),
      class_grades: item.class_grades || [],
      scheduled_date: item.scheduled_date
        ? String(item.scheduled_date).slice(0, 10)
        : "",
      subject_marks: singleSubject(item.subject_marks),
    });
    setExamDateBySubject({});
    setIsAssessmentFormOpen(true);
  };

  const examEntryDateBySubject = useMemo(() => {
    const map: Record<string, string> = {};
    (examTimetableQuery.data?.entries || []).forEach((entry) => {
      map[entry.subject_id] = entry.exam_date;
    });
    return map;
  }, [examTimetableQuery.data?.entries]);

  const submitAssessment = () => {
    if (
      !form.name.trim() ||
      !form.assessment_type.trim() ||
      form.class_grades.length === 0
    ) {
      toast.error("Missing required fields");
      return;
    }
    if (form.subject_marks.length === 0) {
      toast.error("At least one subject mark breakdown is required");
      return;
    }
    for (const row of form.subject_marks) {
      if (Number(row.total_marks) <= 0) {
        toast.error("Each subject row must have total marks > 0");
        return;
      }
      const breakdownTotal = (row.breakdowns || []).reduce(
        (sum, item) => sum + Number(item.marks || 0),
        0,
      );
      if (breakdownTotal > Number(row.total_marks || 0)) {
        toast.error("Breakdown marks cannot exceed total marks per subject");
        return;
      }
    }

    if (editingAssessment) {
      updateAssessmentMutation.mutate();
      // Also save exam timetable if the user filled in any dates for a single-class selection
      const hasExamDates = Object.values(examDateBySubject).some(Boolean);
      if (selectedSingleClassGrade !== null && hasExamDates) {
        examTimetableMutation.mutate();
      }
      return;
    }
    createAssessmentMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view school reports
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {getAcademicYearOptions().map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setIsAssessmentDialogOpen(true)}
          >
            Exam Management
          </Button>
          <Button onClick={handleExportAll}>
            <Download className="mr-2 h-4 w-4" />
            Export All Reports
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white mx-auto mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="font-medium">Student Report</p>
            <p className="text-sm text-muted-foreground">
              Generate student reports
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <p className="font-medium">Attendance Report</p>
            <p className="text-sm text-muted-foreground">
              Monthly attendance stats
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white mx-auto mb-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <p className="font-medium">Financial Report</p>
            <p className="text-sm text-muted-foreground">
              Fee collection status
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white mx-auto mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="font-medium">Performance Report</p>
            <p className="text-sm text-muted-foreground">
              Academic performance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Collected</CardTitle>
            <CardDescription>Monthly fee collections this year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {revenueChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No payment data yet.</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Distribution</CardTitle>
            <CardDescription>Students enrolled per class</CardDescription>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No class data yet.</div>
            ) : (
              <>
                <div
                  style={{
                    height: Math.max(200, gradeDistribution.length * 44),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={gradeDistribution}
                      margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tickFormatter={(v) => String(v)} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [value, 'Students']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11 }}>
                        {gradeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Colour legend */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {gradeDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Attendance Trends</CardTitle>
          <CardDescription>Present vs Absent students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {attendanceChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No attendance data for this week yet.</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  cursor={false}
                />
                <Bar
                  dataKey="present"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Present %"
                />
                <Bar
                  dataKey="absent"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  name="Absent %"
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isAssessmentDialogOpen}
        onOpenChange={setIsAssessmentDialogOpen}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Management</DialogTitle>
            <DialogDescription>
              Manage assessments and subject-wise marks breakdown for{" "}
              {selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button onClick={openCreateAssessment}>
              <Plus className="h-4 w-4 mr-1" />
              Add Assessment
            </Button>
          </div>

          <div className="space-y-3">
            {assessmentsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Loading assessments...
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No assessments found.
              </div>
            ) : (
              assessments.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.assessment_type} •{" "}
                          {(item.class_labels && item.class_labels.length
                            ? item.class_labels.join(", ")
                            : item.class_name || "No Class") +
                            " • " +
                            item.academic_year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date:{" "}
                          {item.scheduled_date
                            ? String(item.scheduled_date).slice(0, 10)
                            : "Not set"}{" "}
                          • Total Marks: {item.total_marks}
                        </p>
                        {item.subject_marks?.length ? (
                          <div className="text-xs text-muted-foreground">
                            {item.subject_marks
                              .map(
                                (sm) =>
                                  `${sm.subject_label || "Subject"}: ${sm.total_marks}`,
                              )
                              .join(" | ")}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditAssessment(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            const confirmed = window.confirm(
                              "Delete this assessment?",
                            );
                            if (confirmed) {
                              deleteAssessmentMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAssessmentFormOpen}
        onOpenChange={(open) => {
          setIsAssessmentFormOpen(open);
          if (!open) {
            setEditingAssessment(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssessment ? "Edit Assessment" : "Add Assessment"}
            </DialogTitle>
            <DialogDescription>
              Define assessment and subject-wise marks breakdown.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Classes</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-md border p-3">
                {classGradeOptions.map((item) => {
                  const checked = form.class_grades.includes(item.grade);
                  return (
                    <label
                      key={`class-grade-${item.grade}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            class_grades: isChecked
                              ? [...prev.class_grades, item.grade].sort(
                                  (a, b) => a - b,
                                )
                              : prev.class_grades.filter(
                                  (grade) => grade !== item.grade,
                                ),
                          }));
                        }}
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assessment Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Half Yearly Exam"
                />
              </div>
              <div className="grid gap-2">
                <Label>Assessment Type</Label>
                <Select
                  value={form.assessment_type}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, assessment_type: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduled_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Subject Marks Breakdown</Label>
              {(() => {
                const row = form.subject_marks[0] || {
                  total_marks: 0,
                  breakdowns: [],
                };
                return (
                  <div className="border rounded-md p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-[180px_auto] gap-3 items-end">
                      <div className="grid gap-1">
                        <Label className="text-xs">Total Marks</Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.total_marks}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              subject_marks: [
                                {
                                  ...(prev.subject_marks[0] || {
                                    total_marks: 0,
                                    breakdowns: [],
                                  }),
                                  total_marks: Number(e.target.value || 0),
                                },
                              ],
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              subject_marks: [
                                {
                                  ...(prev.subject_marks[0] || {
                                    total_marks: 0,
                                    breakdowns: [],
                                  }),
                                  breakdowns: [
                                    ...(prev.subject_marks[0]?.breakdowns || []),
                                    { title: "", marks: 0 },
                                  ],
                                },
                              ],
                            }))
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Breakdown
                        </Button>
                      </div>
                    </div>

                    {(row.breakdowns || []).map((breakdown, breakdownIdx) => (
                      <div
                        key={`breakdown-${breakdownIdx}`}
                        className="grid grid-cols-1 md:grid-cols-[1fr_140px_44px] gap-2 items-end"
                      >
                        <div className="grid gap-1">
                          <Label className="text-xs">Breakdown Title</Label>
                          <Input
                            value={breakdown.title}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                subject_marks: [
                                  {
                                    ...(prev.subject_marks[0] || {
                                      total_marks: 0,
                                      breakdowns: [],
                                    }),
                                    breakdowns: (
                                      prev.subject_marks[0]?.breakdowns || []
                                    ).map((existing, existingIdx) =>
                                      existingIdx === breakdownIdx
                                        ? {
                                            ...existing,
                                            title: e.target.value,
                                          }
                                        : existing,
                                    ),
                                  },
                                ],
                              }))
                            }
                            placeholder="e.g., Theory"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Marks</Label>
                          <Input
                            type="number"
                            min={1}
                            value={breakdown.marks}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                subject_marks: [
                                  {
                                    ...(prev.subject_marks[0] || {
                                      total_marks: 0,
                                      breakdowns: [],
                                    }),
                                    breakdowns: (
                                      prev.subject_marks[0]?.breakdowns || []
                                    ).map((existing, existingIdx) =>
                                      existingIdx === breakdownIdx
                                        ? {
                                            ...existing,
                                            marks: Number(e.target.value || 0),
                                          }
                                        : existing,
                                    ),
                                  },
                                ],
                              }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              subject_marks: [
                                {
                                  ...(prev.subject_marks[0] || {
                                    total_marks: 0,
                                    breakdowns: [],
                                  }),
                                  breakdowns: (
                                    prev.subject_marks[0]?.breakdowns || []
                                  ).filter(
                                    (_, existingIdx) =>
                                      existingIdx !== breakdownIdx,
                                  ),
                                },
                              ],
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="text-xs text-muted-foreground">
                      Breakdown Total:{" "}
                      {(row.breakdowns || []).reduce(
                        (sum, item) => sum + Number(item.marks || 0),
                        0,
                      )}{" "}
                      / {Number(row.total_marks || 0)}
                    </div>
                  </div>
                );
              })()}

              <div className="text-sm font-medium">
                Total Marks: {totalFormMarks}
              </div>
            </div>

            <div className="space-y-3 border rounded-md p-3">
              <Label>Exam Time table</Label>

              {selectedSingleClassGrade === null ? (
                <p className="text-sm text-muted-foreground">
                  Select only one class to use this feature.
                </p>
              ) : !editingAssessment?.id ? (
                <p className="text-sm text-muted-foreground">
                  Save assessment first to configure exam timetable.
                </p>
              ) : examTimetableQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading subjects...</p>
              ) : (examTimetableQuery.data?.subjects || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subjects found for selected class.
                </p>
              ) : (
                <div className="space-y-2">
                  {(examTimetableQuery.data?.subjects || []).map((subject) => (
                    <div
                      key={`exam-subject-${subject.subject_id}`}
                      className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2 items-center"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{subject.name}</span>{" "}
                        <span className="text-muted-foreground">({subject.code})</span>
                      </div>
                      <Input
                        type="date"
                        value={
                          examDateBySubject[subject.subject_id] ||
                          examEntryDateBySubject[subject.subject_id] ||
                          ""
                        }
                        onChange={(e) =>
                          setExamDateBySubject((prev) => ({
                            ...prev,
                            [subject.subject_id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssessmentFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAssessment}
              disabled={
                createAssessmentMutation.isPending ||
                updateAssessmentMutation.isPending ||
                examTimetableMutation.isPending
              }
            >
              {createAssessmentMutation.isPending ||
              updateAssessmentMutation.isPending ||
              examTimetableMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingAssessment ? (
                "Save Changes"
              ) : (
                "Create Assessment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
