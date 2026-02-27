"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Edit, FileText, GraduationCap, Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface SubjectOption {
  subject_id: string;
  subject_name: string;
}

interface CatalogClass {
  id: string;
  name: string;
  sort_order: number;
}

interface CatalogSubject {
  id: string;
  name: string;
  code?: string;
}

interface AssignmentItem {
  class: CatalogClass;
  subjects: CatalogSubject[];
}

interface ClassOption {
  class_id: string;
  class_name: string;
  class_level: string;
  subjects: SubjectOption[];
}

interface QuizItem {
  id: string;
  title: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  chapter_name?: string;
  scheduled_at: string;
  is_anytime: boolean;
  duration_minutes: number;
  total_marks: number;
  question_count: number;
  status: "upcoming" | "active" | "completed";
}

interface QuizChapter {
  id: string;
  class_id: string;
  subject_id: string;
  chapter_name: string;
  chapter_source?: string;
  can_edit?: boolean;
}

interface FormOption {
  option_text: string;
  is_correct: boolean;
}

interface FormQuestion {
  question_text: string;
  marks: number;
  options: FormOption[];
}

function defaultQuestion(): FormQuestion {
  return {
    question_text: "",
    marks: 1,
    options: [
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
    ],
  };
}

export default function SuperAdminQuizSchedulerPage() {
  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [classID, setClassID] = useState("");
  const [subjectID, setSubjectID] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [isAnytime, setIsAnytime] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [totalMarks, setTotalMarks] = useState("0");
  const [questions, setQuestions] = useState<FormQuestion[]>([defaultQuestion()]);

  const [openManagedChapters, setOpenManagedChapters] = useState(false);
  const [managedChapterClassID, setManagedChapterClassID] = useState("");
  const [managedChapterSubjectID, setManagedChapterSubjectID] = useState("");
  const [managedChapterName, setManagedChapterName] = useState("");
  const [managedEditChapterID, setManagedEditChapterID] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editQuiz, setEditQuiz] = useState<QuizItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editIsAnytime, setEditIsAnytime] = useState(false);
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("09:00");
  const [editDuration, setEditDuration] = useState("30");

  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  const [openAddQ, setOpenAddQ] = useState(false);
  const [addQQuizId, setAddQQuizId] = useState<string | null>(null);
  const [addQQuestion, setAddQQuestion] = useState("");
  const [addQMarks, setAddQMarks] = useState(1);
  const [addQOptions, setAddQOptions] = useState<FormOption[]>([
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
  ]);

  const resetAddQ = () => {
    setAddQQuestion("");
    setAddQMarks(1);
    setAddQOptions([
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
    ]);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const classesQuery = useQuery({
    queryKey: ["super-admin-catalog-classes", "quiz-scheduler"],
    queryFn: () => api.get<{ classes: CatalogClass[] }>("/super-admin/catalog/classes"),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["super-admin-catalog-assignments", "quiz-scheduler"],
    queryFn: () => api.get<{ assignments: AssignmentItem[] }>("/super-admin/catalog/assignments"),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const subjectsQuery = useQuery({
    queryKey: ["super-admin-catalog-subjects", "quiz-scheduler"],
    queryFn: () => api.get<{ subjects: CatalogSubject[] }>("/super-admin/catalog/subjects"),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const quizzesQuery = useQuery({
    queryKey: ["super-admin-quizzes", classFilter, subjectFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("page_size", "100");
      if (classFilter !== "all") params.set("class_id", classFilter);
      if (subjectFilter !== "all") params.set("subject_id", subjectFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      return api.get<{ quizzes: QuizItem[] }>(`/super-admin/quizzes?${params.toString()}`);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const classOptions = useMemo<ClassOption[]>(() => {
    const classes = classesQuery.data?.classes || [];
    const assignments = assignmentsQuery.data?.assignments || [];

    const subjects = subjectsQuery.data?.subjects || [];
    const subjectMap = new Map<string, CatalogSubject>();
    for (const subject of subjects) {
      subjectMap.set(subject.id, subject);
    }

    const subjectsByClass = new Map<string, SubjectOption[]>();
    for (const assignment of assignments) {
      const mergedSubjects: SubjectOption[] = [];
      const seen = new Set<string>();
      for (const subject of assignment.subjects || []) {
        const resolved = subjectMap.get(subject.id) || subject;
        if (seen.has(resolved.id)) continue;
        seen.add(resolved.id);
        mergedSubjects.push({
          subject_id: resolved.id,
          subject_name: resolved.name,
        });
      }
      mergedSubjects.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
      subjectsByClass.set(
        assignment.class.id,
        mergedSubjects,
      );
    }

    return [...classes]
      .sort((a, b) => {
        if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }
        return a.name.localeCompare(b.name);
      })
      .map((catalogClass) => ({
        class_id: catalogClass.id,
        class_name: catalogClass.name,
        class_level: catalogClass.name,
        subjects: subjectsByClass.get(catalogClass.id) || [],
      }));
  }, [classesQuery.data?.classes, assignmentsQuery.data?.assignments, subjectsQuery.data?.subjects]);
  const selectedClass = useMemo(() => classOptions.find((c) => c.class_id === classID) || null, [classOptions, classID]);
  const subjectOptions = selectedClass?.subjects || [];
  const managedSelectedClass = useMemo(
    () => classOptions.find((c) => c.class_id === managedChapterClassID) || null,
    [classOptions, managedChapterClassID],
  );
  const managedSubjectOptions = managedSelectedClass?.subjects || [];
  const selectedFilterClass = useMemo(() => classOptions.find((c) => c.class_id === classFilter) || null, [classOptions, classFilter]);
  const subjectFilterOptions = selectedFilterClass?.subjects || [];
  const quizzes = useMemo(() => quizzesQuery.data?.quizzes || [], [quizzesQuery.data?.quizzes]);

  const stats = useMemo(() => {
    const upcoming = quizzes.filter((q) => q.status === "upcoming").length;
    const active = quizzes.filter((q) => q.status === "active").length;
    const completed = quizzes.filter((q) => q.status === "completed").length;
    return { upcoming, active, completed, total: quizzes.length };
  }, [quizzes]);

  const createChapterOptionsQuery = useQuery({
    queryKey: ["super-admin-quiz-chapters", "create", classID, subjectID],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("class_id", classID);
      params.set("subject_id", subjectID);
      return api.get<{ chapters: QuizChapter[] }>(`/super-admin/quizzes/chapters?${params.toString()}`);
    },
    enabled: openCreate && !!classID && !!subjectID,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const managedChapterQuery = useQuery({
    queryKey: ["super-admin-quiz-chapters", "manage", managedChapterClassID, managedChapterSubjectID],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("class_id", managedChapterClassID);
      params.set("subject_id", managedChapterSubjectID);
      return api.get<{ chapters: QuizChapter[] }>(`/super-admin/quizzes/chapters?${params.toString()}`);
    },
    enabled: openManagedChapters && !!managedChapterClassID && !!managedChapterSubjectID,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const resetForm = () => {
    setTitle("");
    setClassID("");
    setSubjectID("");
    setChapterName("");
    setIsAnytime(false);
    setScheduledDate("");
    setScheduledTime("09:00");
    setDurationMinutes("30");
    setTotalMarks("0");
    setQuestions([defaultQuestion()]);
  };

  const resetManagedChapterForm = () => {
    setManagedChapterName("");
    setManagedEditChapterID(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Quiz title is required");
      if (!classID) throw new Error("Class is required");
      if (!subjectID) throw new Error("Subject is required");
      if (!chapterName.trim()) throw new Error("Chapter is required");
      if (!isAnytime && !scheduledDate) throw new Error("Date is required");
      if (!isAnytime && !scheduledTime) throw new Error("Time is required");
      if (questions.length === 0) throw new Error("Add at least one question");

      return api.post<{ id: string; message: string }>("/super-admin/quizzes", {
        title: title.trim(),
        class_id: classID,
        subject_id: subjectID,
        chapter_name: chapterName.trim(),
        is_anytime: isAnytime,
        scheduled_at: isAnytime ? "" : `${scheduledDate}T${scheduledTime}:00Z`,
        duration_minutes: Number(durationMinutes || 30),
        total_marks: Number(totalMarks || 0),
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          marks: Number(q.marks || 1),
          options: q.options.map((o) => ({ option_text: o.option_text.trim(), is_correct: !!o.is_correct })),
        })),
      });
    },
    onSuccess: () => {
      toast.success("Quiz created");
      setOpenCreate(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to create quiz", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: (payload: { id: string; title: string; scheduled_at: string; is_anytime: boolean; duration_minutes: number }) =>
      api.put(`/super-admin/quizzes/${payload.id}`, {
        title: payload.title,
        scheduled_at: payload.scheduled_at,
        is_anytime: payload.is_anytime,
        duration_minutes: payload.duration_minutes,
      }),
    onSuccess: () => {
      toast.success("Quiz updated");
      setOpenEdit(false);
      setEditQuiz(null);
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to update quiz", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => api.delete(`/super-admin/quizzes/${quizId}`),
    onSuccess: () => {
      toast.success("Quiz deleted");
      setDeleteQuizId(null);
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to delete quiz", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: () => {
      if (!addQQuizId) throw new Error("No quiz selected");
      if (!addQQuestion.trim()) throw new Error("Question text required");
      if (addQOptions.length < 2) throw new Error("At least 2 options needed");
      if (!addQOptions.some((o) => o.is_correct)) throw new Error("Mark one option as correct");
      return api.post(`/super-admin/quizzes/${addQQuizId}/questions`, {
        question_text: addQQuestion.trim(),
        marks: addQMarks,
        options: addQOptions.map((o) => ({ option_text: o.option_text.trim(), is_correct: o.is_correct })),
      });
    },
    onSuccess: () => {
      toast.success("Question added");
      setOpenAddQ(false);
      resetAddQ();
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to add question", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const createManagedChapterMutation = useMutation({
    mutationFn: async () => {
      if (!managedChapterClassID) throw new Error("Class is required");
      if (!managedChapterSubjectID) throw new Error("Subject is required");
      if (!managedChapterName.trim()) throw new Error("Chapter name is required");
      return api.post<{ chapter: QuizChapter }>("/super-admin/quizzes/chapters", {
        class_id: managedChapterClassID,
        subject_id: managedChapterSubjectID,
        chapter_name: managedChapterName.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Chapter saved");
      resetManagedChapterForm();
      queryClient.invalidateQueries({ queryKey: ["super-admin-quiz-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to save chapter", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const updateManagedChapterMutation = useMutation({
    mutationFn: async () => {
      if (!managedEditChapterID) throw new Error("Chapter not selected");
      if (!managedChapterName.trim()) throw new Error("Chapter name is required");
      return api.put<{ chapter: QuizChapter }>(`/super-admin/quizzes/chapters/${managedEditChapterID}`, {
        chapter_name: managedChapterName.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Chapter updated");
      resetManagedChapterForm();
      queryClient.invalidateQueries({ queryKey: ["super-admin-quiz-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to update chapter", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const deleteManagedChapterMutation = useMutation({
    mutationFn: (chapterID: string) => api.delete(`/super-admin/quizzes/chapters/${chapterID}`),
    onSuccess: () => {
      toast.success("Chapter deleted");
      resetManagedChapterForm();
      queryClient.invalidateQueries({ queryKey: ["super-admin-quiz-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-quizzes"] });
    },
    onError: (error: unknown) => {
      toast.error("Failed to delete chapter", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    },
  });

  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  };

  const removeQuestion = (qIdx: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const updateQuestionText = (qIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === qIdx ? { ...q, question_text: value } : q)));
  };

  const updateQuestionMarks = (qIdx: number, value: number) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === qIdx ? { ...q, marks: value } : q)));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, options: [...q.options, { option_text: "", is_correct: false }] } : q)),
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const nextOptions = q.options.filter((_, optionIdx) => optionIdx !== oIdx);
        if (!nextOptions.some((o) => o.is_correct) && nextOptions.length > 0) {
          nextOptions[0].is_correct = true;
        }
        return { ...q, options: nextOptions };
      }),
    );
  };

  const updateOptionText = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o, optionIdx) => (optionIdx === oIdx ? { ...o, option_text: value } : o)),
        };
      }),
    );
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o, optionIdx) => ({ ...o, is_correct: optionIdx === oIdx })),
        };
      }),
    );
  };

  const chapterOptions = useMemo(
    () => createChapterOptionsQuery.data?.chapters || [],
    [createChapterOptionsQuery.data?.chapters],
  );

  const managedChapters = useMemo(
    () => managedChapterQuery.data?.chapters || [],
    [managedChapterQuery.data?.chapters],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Super Admin Quiz Scheduler</h1>
          <p className="text-muted-foreground">Schedule global quizzes by class and subject</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={openManagedChapters} onOpenChange={(v) => {
            setOpenManagedChapters(v);
            if (!v) {
              setManagedChapterClassID("");
              setManagedChapterSubjectID("");
              resetManagedChapterForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Subject Management
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Subject Management</DialogTitle>
                <DialogDescription>Manage platform chapters by class and subject.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Class</Label>
                    <Select value={managedChapterClassID} onValueChange={(value) => { setManagedChapterClassID(value); setManagedChapterSubjectID(""); resetManagedChapterForm(); }}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classOptions.map((c) => (
                          <SelectItem key={c.class_id} value={c.class_id}>{c.class_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select
                      value={managedChapterSubjectID}
                      onValueChange={(value) => { setManagedChapterSubjectID(value); resetManagedChapterForm(); }}
                      disabled={!managedChapterClassID || managedSubjectOptions.length === 0}
                    >
                      <SelectTrigger><SelectValue placeholder={managedChapterClassID ? "Select subject" : "Select class first"} /></SelectTrigger>
                      <SelectContent>
                        {managedSubjectOptions.map((s) => (
                          <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="grid gap-2 flex-1">
                    <Label>Chapter Name</Label>
                    <Input
                      value={managedChapterName}
                      onChange={(e) => setManagedChapterName(e.target.value)}
                      placeholder="Enter chapter name"
                      disabled={!managedChapterClassID || !managedChapterSubjectID}
                    />
                  </div>
                  {managedEditChapterID ? (
                    <Button disabled={updateManagedChapterMutation.isPending} onClick={() => updateManagedChapterMutation.mutate()}>
                      {updateManagedChapterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                    </Button>
                  ) : (
                    <Button disabled={createManagedChapterMutation.isPending} onClick={() => createManagedChapterMutation.mutate()}>
                      {createManagedChapterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  )}
                  {managedEditChapterID ? (
                    <Button
                      variant="outline"
                      onClick={resetManagedChapterForm}
                      disabled={createManagedChapterMutation.isPending || updateManagedChapterMutation.isPending}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                  {!managedChapterClassID || !managedChapterSubjectID ? (
                    <p className="text-sm text-muted-foreground">Select class and subject to manage chapters.</p>
                  ) : managedChapterQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading chapters...</p>
                  ) : managedChapters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No chapters found.</p>
                  ) : (
                    managedChapters.map((chapter) => (
                      <div key={chapter.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2">
                        <span className="text-sm">{chapter.chapter_name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setManagedEditChapterID(chapter.id);
                              setManagedChapterName(chapter.chapter_name);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteManagedChapterMutation.mutate(chapter.id)}
                            disabled={deleteManagedChapterMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>Set up a new global quiz.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Quiz Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select value={classID} onValueChange={(value) => { setClassID(value); setSubjectID(""); setChapterName(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classOptions.map((c) => <SelectItem key={c.class_id} value={c.class_id}>{c.class_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Select value={subjectID} onValueChange={(value) => { setSubjectID(value); setChapterName(""); }} disabled={!classID || subjectOptions.length === 0}>
                    <SelectTrigger><SelectValue placeholder={classID ? "Select subject" : "Select class first"} /></SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((s) => <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Chapter</Label>
                <Select
                  value={chapterName}
                  onValueChange={setChapterName}
                  disabled={!classID || !subjectID || createChapterOptionsQuery.isLoading || chapterOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !classID || !subjectID
                          ? "Select class and subject first"
                          : createChapterOptionsQuery.isLoading
                            ? "Loading chapters..."
                            : chapterOptions.length === 0
                              ? "No chapters found in Subject Management"
                              : "Select chapter"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {chapterOptions.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.chapter_name}>
                        {chapter.chapter_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input id="create-anytime-super" type="checkbox" checked={isAnytime} onChange={(e) => setIsAnytime(e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="create-anytime-super">AnyTime</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} disabled={isAnytime} />
                </div>
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} disabled={isAnytime} />
                </div>
                <div className="grid gap-2">
                  <Label>Duration (mins)</Label>
                  <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Total Marks</Label>
                  <Input type="number" min={0} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}><Plus className="mr-1 h-3 w-3" />Add Question</Button>
                </div>
                {questions.map((q, qIdx) => (
                  <Card key={`q-${qIdx}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Input value={q.question_text} onChange={(e) => updateQuestionText(qIdx, e.target.value)} placeholder={`Question ${qIdx + 1}`} />
                        <Input className="w-24" type="number" min={1} value={q.marks} onChange={(e) => updateQuestionMarks(qIdx, Number(e.target.value || 1))} />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(qIdx)} disabled={questions.length === 1}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={`q-${qIdx}-o-${oIdx}`} className="flex items-center gap-2">
                            <input type="checkbox" checked={opt.is_correct} onChange={() => setCorrectOption(qIdx, oIdx)} className="h-4 w-4" />
                            <Input value={opt.option_text} onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIdx, oIdx)} disabled={q.options.length <= 2}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={() => addOption(qIdx)}><Plus className="mr-1 h-3 w-3" />Add Option</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Quiz"}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" placeholder="Search by title, class or subject" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 xl:w-auto">
              <Select value={classFilter} onValueChange={(value) => { setClassFilter(value); setSubjectFilter("all"); }}>
                <SelectTrigger className="w-full sm:w-[220px]"><GraduationCap className="h-4 w-4 mr-2" /><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((opt) => <SelectItem key={opt.class_id} value={opt.class_id}>{opt.class_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={classFilter === "all"}>
                <SelectTrigger className="w-full sm:w-[220px]"><FileText className="h-4 w-4 mr-2" /><SelectValue placeholder={classFilter === "all" ? "Select class first" : "All Subjects"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectFilterOptions.map((opt) => <SelectItem key={opt.subject_id} value={opt.subject_id}>{opt.subject_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 md:p-6 text-center"><p className="text-xl md:text-3xl font-bold text-primary">{stats.upcoming}</p><p className="text-sm text-muted-foreground">Upcoming</p></CardContent></Card>
        <Card><CardContent className="p-4 md:p-6 text-center"><p className="text-xl md:text-3xl font-bold text-green-500">{stats.active}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 md:p-6 text-center"><p className="text-xl md:text-3xl font-bold text-blue-500">{stats.completed}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-4 md:p-6 text-center"><p className="text-xl md:text-3xl font-bold text-purple-500">{stats.total}</p><p className="text-sm text-muted-foreground">Total Quizzes</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {quizzesQuery.isLoading || classesQuery.isLoading || assignmentsQuery.isLoading || subjectsQuery.isLoading ? (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-4 md:p-8 text-center text-muted-foreground">Loading quizzes...</CardContent></Card>
        ) : quizzes.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-4 md:p-8 text-center text-muted-foreground">No quizzes found.</CardContent></Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={quiz.status === "upcoming" ? "default" : quiz.status === "active" ? "success" : "secondary"}>{quiz.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditQuiz(quiz);
                      setEditTitle(quiz.title);
                      setEditIsAnytime(!!quiz.is_anytime);
                      setEditScheduledDate(quiz.scheduled_at.slice(0, 10));
                      const rawTime = new Date(quiz.scheduled_at);
                      const hh = rawTime.getUTCHours().toString().padStart(2, "0");
                      const mm = rawTime.getUTCMinutes().toString().padStart(2, "0");
                      setEditScheduledTime(`${hh}:${mm}`);
                      setEditDuration(String(quiz.duration_minutes));
                      setOpenEdit(true);
                    }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteQuizId(quiz.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <CardDescription>{quiz.subject_name}{quiz.chapter_name ? ` • ${quiz.chapter_name}` : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{quiz.class_name}</span></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>{quiz.is_anytime ? "Anytime" : new Date(quiz.scheduled_at).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{quiz.duration_minutes} minutes</span></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /><span>{quiz.question_count} questions • {quiz.total_marks} marks</span></div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => { if (quiz.status === "upcoming" || quiz.status === "active") { setAddQQuizId(quiz.id); setOpenAddQ(true); } }}>
                    {quiz.status === "upcoming" || quiz.status === "active" ? "Add Question" : "View Results"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={openEdit} onOpenChange={(v) => { setOpenEdit(v); if (!v) setEditQuiz(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>Update the quiz details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Quiz title" />
            </div>
            <div className="flex items-center gap-2">
              <input id="edit-anytime-super" type="checkbox" checked={editIsAnytime} onChange={(e) => setEditIsAnytime(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="edit-anytime-super">AnyTime</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)} disabled={editIsAnytime} />
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Input type="time" value={editScheduledTime} onChange={(e) => setEditScheduledTime(e.target.value)} disabled={editIsAnytime} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={1} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button disabled={updateQuizMutation.isPending} onClick={() => {
              if (!editQuiz) return;
              updateQuizMutation.mutate({
                id: editQuiz.id,
                title: editTitle,
                scheduled_at: editIsAnytime ? "" : (editScheduledDate ? `${editScheduledDate}T${editScheduledTime || "09:00"}:00Z` : ""),
                is_anytime: editIsAnytime,
                duration_minutes: Number(editDuration) || 30,
              });
            }}>
              {updateQuizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteQuizId} onOpenChange={(v) => { if (!v) setDeleteQuizId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Quiz?</DialogTitle>
            <DialogDescription>This will permanently delete the quiz and all its questions. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteQuizId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteQuizMutation.isPending} onClick={() => { if (deleteQuizId) deleteQuizMutation.mutate(deleteQuizId); }}>
              {deleteQuizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddQ} onOpenChange={(v) => { setOpenAddQ(v); if (!v) { resetAddQ(); setAddQQuizId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>Add a new question with options to this quiz.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Question Text</Label>
              <Input value={addQQuestion} onChange={(e) => setAddQQuestion(e.target.value)} placeholder="Enter question..." />
            </div>
            <div className="grid gap-2">
              <Label>Marks</Label>
              <Input type="number" min={1} value={addQMarks} onChange={(e) => setAddQMarks(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Options <span className="text-muted-foreground text-xs">(click radio to mark correct)</span></Label>
              <div className="space-y-2">
                {addQOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input type="radio" name="correct-option-super" checked={opt.is_correct} onChange={() => setAddQOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === oIdx })))} className="accent-primary" />
                    <Input value={opt.option_text} onChange={(e) => setAddQOptions((prev) => prev.map((o, i) => i === oIdx ? { ...o, option_text: e.target.value } : o))} placeholder={`Option ${oIdx + 1}`} />
                    {addQOptions.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => setAddQOptions((prev) => prev.filter((_, i) => i !== oIdx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-fit" onClick={() => setAddQOptions((prev) => [...prev, { option_text: "", is_correct: false }])}><Plus className="h-4 w-4 mr-1" /> Add Option</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenAddQ(false); resetAddQ(); }}>Cancel</Button>
            <Button disabled={addQuestionMutation.isPending} onClick={() => addQuestionMutation.mutate()}>
              {addQuestionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
