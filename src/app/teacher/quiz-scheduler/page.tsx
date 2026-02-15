"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { Calendar, Clock, Edit, FileText, GraduationCap, Loader2, Plus, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface SubjectOption {
  subject_id: string
  subject_name: string
}

interface ClassOption {
  class_id: string
  class_name: string
  class_level: string
  subjects: SubjectOption[]
}

interface QuizItem {
  id: string
  title: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  scheduled_at: string
  duration_minutes: number
  total_marks: number
  question_count: number
  status: "upcoming" | "active" | "completed"
}

interface FormOption {
  option_text: string
  is_correct: boolean
}

interface FormQuestion {
  question_text: string
  marks: number
  options: FormOption[]
}

function defaultQuestion(): FormQuestion {
  return {
    question_text: "",
    marks: 1,
    options: [
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
    ],
  }
}

export default function QuizSchedulerPage() {
  const queryClient = useQueryClient()
  const [openCreate, setOpenCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [classID, setClassID] = useState("")
  const [subjectID, setSubjectID] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("30")
  const [totalMarks, setTotalMarks] = useState("0")
  const [questions, setQuestions] = useState<FormQuestion[]>([defaultQuestion()])

  const optionsQuery = useQuery({
    queryKey: ["teacher-quiz-options"],
    queryFn: () => api.get<{ options: ClassOption[] }>("/teacher/quizzes/options"),
  })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const quizzesQuery = useQuery({
    queryKey: ["teacher-quizzes", classFilter, subjectFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("page_size", "100")
      if (classFilter !== "all") params.set("class_id", classFilter)
      if (subjectFilter !== "all") params.set("subject_id", subjectFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)
      return api.get<{ quizzes: QuizItem[] }>(`/teacher/quizzes?${params.toString()}`)
    },
  })

  const classOptions = optionsQuery.data?.options || []
  const selectedClass = useMemo(
    () => classOptions.find((c) => c.class_id === classID) || null,
    [classOptions, classID]
  )
  const subjectOptions = selectedClass?.subjects || []
  const selectedFilterClass = useMemo(
    () => classOptions.find((c) => c.class_id === classFilter) || null,
    [classOptions, classFilter]
  )
  const subjectFilterOptions = selectedFilterClass?.subjects || []
  const quizzes = quizzesQuery.data?.quizzes || []

  const stats = useMemo(() => {
    const upcoming = quizzes.filter((q) => q.status === "upcoming").length
    const active = quizzes.filter((q) => q.status === "active").length
    const completed = quizzes.filter((q) => q.status === "completed").length
    return { upcoming, active, completed, total: quizzes.length }
  }, [quizzes])

  const resetForm = () => {
    setTitle("")
    setClassID("")
    setSubjectID("")
    setScheduledDate("")
    setDurationMinutes("30")
    setTotalMarks("0")
    setQuestions([defaultQuestion()])
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Quiz title is required")
      if (!classID) throw new Error("Class is required")
      if (!subjectID) throw new Error("Subject is required")
      if (!scheduledDate) throw new Error("Date is required")
      if (questions.length === 0) throw new Error("Add at least one question")

      const payload = {
        title: title.trim(),
        class_id: classID,
        subject_id: subjectID,
        scheduled_at: `${scheduledDate}T00:00:00Z`,
        duration_minutes: Number(durationMinutes || 30),
        total_marks: Number(totalMarks || 0),
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          marks: Number(q.marks || 1),
          options: q.options.map((o) => ({
            option_text: o.option_text.trim(),
            is_correct: !!o.is_correct,
          })),
        })),
      }

      return api.post<{ id: string; message: string }>("/teacher/quizzes", payload)
    },
    onSuccess: () => {
      toast.success("Quiz created")
      setOpenCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["teacher-quizzes"] })
    },
    onError: (error: unknown) => {
      toast.error("Failed to create quiz", {
        description: error instanceof Error ? error.message : "Unexpected error",
      })
    },
  })

  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion()])
  }

  const removeQuestion = (qIdx: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))
  }

  const updateQuestionText = (qIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, question_text: value } : q))
    )
  }

  const updateQuestionMarks = (qIdx: number, value: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIdx ? { ...q, marks: value } : q))
    )
  }

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIdx ? { ...q, options: [...q.options, { option_text: "", is_correct: false }] } : q
      )
    )
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q
        const nextOptions = q.options.filter((_, optionIdx) => optionIdx !== oIdx)
        if (nextOptions.length === 1) {
          nextOptions[0].is_correct = true
        } else if (!nextOptions.some((o) => o.is_correct) && nextOptions.length > 0) {
          nextOptions[0].is_correct = true
        }
        return { ...q, options: nextOptions }
      })
    )
  }

  const updateOptionText = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q
        return {
          ...q,
          options: q.options.map((o, optionIdx) =>
            optionIdx === oIdx ? { ...o, option_text: value } : o
          ),
        }
      })
    )
  }

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q
        return {
          ...q,
          options: q.options.map((o, optionIdx) => ({
            ...o,
            is_correct: optionIdx === oIdx,
          })),
        }
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Scheduler</h1>
          <p className="text-muted-foreground">Create and schedule quizzes for your classes</p>
        </div>
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
              <DialogDescription>Set up a new quiz for your students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Quiz Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select
                    value={classID}
                    onValueChange={(value) => {
                      setClassID(value)
                      setSubjectID("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((c) => (
                        <SelectItem key={c.class_id} value={c.class_id}>
                          {c.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Select value={subjectID} onValueChange={setSubjectID} disabled={!classID}>
                    <SelectTrigger>
                      <SelectValue placeholder={classID ? "Select subject" : "Select class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((s) => (
                        <SelectItem key={s.subject_id} value={s.subject_id}>
                          {s.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
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
                  <Label>Generate Question</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Question
                  </Button>
                </div>
                {questions.map((q, qIdx) => (
                  <Card key={`q-${qIdx}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={q.question_text}
                          onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                          placeholder={`Question ${qIdx + 1}`}
                        />
                        <Input
                          className="w-24"
                          type="number"
                          min={1}
                          value={q.marks}
                          onChange={(e) => updateQuestionMarks(qIdx, Number(e.target.value || 1))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeQuestion(qIdx)}
                          disabled={questions.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={`q-${qIdx}-o-${oIdx}`} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={opt.is_correct}
                              onChange={() => setCorrectOption(qIdx, oIdx)}
                              className="h-4 w-4"
                            />
                            <Input
                              value={opt.option_text}
                              onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(qIdx, oIdx)}
                              disabled={q.options.length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={() => addOption(qIdx)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Add Option
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quiz"
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
                placeholder="Search by title, class or subject"
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
                  <FileText className="h-4 w-4 mr-2" />
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{stats.upcoming}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-purple-500">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Quizzes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzesQuery.isLoading ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">Loading quizzes...</CardContent>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">No quizzes found.</CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      quiz.status === "upcoming" ? "default" : quiz.status === "active" ? "success" : "secondary"
                    }
                  >
                    {quiz.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <CardDescription>{quiz.subject_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{quiz.class_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(quiz.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{quiz.question_count} questions • {quiz.total_marks} marks</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" disabled>
                    {quiz.status === "upcoming"
                      ? "Add Questions"
                      : quiz.status === "active"
                      ? "View Submissions"
                      : "View Results"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
