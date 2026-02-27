"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    CheckCircle, Clock, AlertCircle, Receipt,
    Wallet, Calendar, CreditCard,
    FileText, Users, Search,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useTeacherClasses, useTeacherClassStudents, useTeacherStudentFees } from '@/hooks/useTeacherFees'
import { Skeleton } from '@/components/ui/skeleton'

export default function TeacherFeesPage() {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

    const { data: classesData, isLoading: loadingClasses } = useTeacherClasses()
    const { data: studentsData, isLoading: loadingStudents } = useTeacherClassStudents(selectedClassId)
    const { data: feeData, isLoading: loadingFees, isError: feeError } = useTeacherStudentFees(selectedStudentId)

    const classes = classesData?.classes ?? []
    const students = studentsData?.students ?? []

    const breakdown = feeData?.breakdown ?? []
    const paymentHistory = feeData?.payment_history ?? []
    const totalFees = feeData?.total_amount ?? 0
    const paidFees = feeData?.paid_amount ?? 0
    const pendingFees = feeData?.pending_amount ?? 0

    const handleClassChange = (value: string) => {
        setSelectedClassId(value)
        setSelectedStudentId(null) // reset student on class change
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Fee Overview
                </h1>
                <p className="text-muted-foreground mt-1">View fee status of students in your classes</p>
            </div>

            {/* Filter Row */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Select Class */}
                        <div className="flex-1 space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                Select Class
                            </label>
                            <Select
                                value={selectedClassId ?? ''}
                                onValueChange={handleClassChange}
                                disabled={loadingClasses}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingClasses ? 'Loading classes…' : 'Pick a class'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.class_name}
                                            {cls.is_class_teacher && (
                                                <span className="ml-2 text-xs text-muted-foreground">(Class Incharge)</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                    {classes.length === 0 && !loadingClasses && (
                                        <SelectItem value="__none" disabled>No classes assigned</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Select Student */}
                        <div className="flex-1 space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <Search className="h-4 w-4" />
                                Select Student
                            </label>
                            <Select
                                value={selectedStudentId ?? ''}
                                onValueChange={setSelectedStudentId}
                                disabled={!selectedClassId || loadingStudents}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            !selectedClassId
                                                ? 'Select a class first'
                                                : loadingStudents
                                                    ? 'Loading students…'
                                                    : 'Pick a student'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.full_name}
                                            {s.roll_number && (
                                                <span className="ml-2 text-xs text-muted-foreground">#{s.roll_number}</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                    {students.length === 0 && !loadingStudents && selectedClassId && (
                                        <SelectItem value="__none" disabled>No students in this class</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Placeholder when no student is selected */}
            {!selectedStudentId && (
                <Card className="border-0 shadow-md">
                    <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">
                            {!selectedClassId
                                ? 'Select a class, then a student to view their fee details.'
                                : 'Select a student to view their fee details.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Fee content — only when a student is selected */}
            {selectedStudentId && (
                <>
                    {/* Student context banner */}
                    {feeData && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 border">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                                {feeData.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold">{feeData.student_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {feeData.class_name} · Academic Year {feeData.academic_year}
                                </p>
                            </div>
                        </div>
                    )}

                    {loadingFees && (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-28 rounded-2xl" />
                            ))}
                        </div>
                    )}

                    {feeError && (
                        <Card className="border-destructive">
                            <CardContent className="py-8 text-center text-destructive text-sm">
                                Failed to load fee data. The student may not be in your assigned classes.
                            </CardContent>
                        </Card>
                    )}

                    {!loadingFees && !feeError && feeData && (
                        <>
                            {/* Fee Summary Cards */}
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 overflow-hidden">
                                    <CardContent className="p-4 md:p-6 relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12" />
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30">
                                                <Wallet className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalFees)}</p>
                                                <p className="text-sm text-muted-foreground">Total Fees</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 overflow-hidden">
                                    <CardContent className="p-4 md:p-6 relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-12 translate-x-12" />
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                                                <CheckCircle className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(paidFees)}</p>
                                                <p className="text-sm text-muted-foreground">Paid</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 overflow-hidden">
                                    <CardContent className="p-4 md:p-6 relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -translate-y-12 translate-x-12" />
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
                                                <AlertCircle className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(pendingFees)}</p>
                                                <p className="text-sm text-muted-foreground">Pending</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Payment Progress */}
                            {totalFees > 0 && (
                                <Card className="border-0 shadow-lg overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white pb-4">
                                        <CardTitle className="text-white">Payment Progress</CardTitle>
                                        <CardDescription className="text-emerald-100">Academic Year {feeData.academic_year}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 md:p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Overall Payment Status</span>
                                                <Badge variant={pendingFees === 0 ? 'success' : 'warning'} className="text-sm px-4 py-1">
                                                    {pendingFees === 0 ? '✓ Fully Paid' : `${Math.round((paidFees / totalFees) * 100)}% Paid`}
                                                </Badge>
                                            </div>
                                            <div className="relative">
                                                <Progress value={(paidFees / totalFees) * 100} className="h-6 rounded-full" />
                                                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow">
                                                    {formatCurrency(paidFees)} / {formatCurrency(totalFees)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-600">Paid: {formatCurrency(paidFees)}</span>
                                                <span className="text-red-600">Pending: {formatCurrency(pendingFees)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Fee Breakdown */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <CardTitle>Fee Breakdown</CardTitle>
                                    </div>
                                    <CardDescription>Individual fee components for {feeData.student_name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {breakdown.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No fee demands found for this student.</p>
                                        )}
                                        {breakdown.map((fee, index) => (
                                            <div
                                                key={fee.id}
                                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg stagger-${index + 1} animate-slide-up ${
                                                    fee.status === 'paid'
                                                        ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 hover:border-green-300'
                                                        : fee.status === 'partial'
                                                            ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 hover:border-yellow-300'
                                                            : fee.status === 'overdue'
                                                                ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-300'
                                                                : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 hover:border-red-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg">{fee.purpose_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Paid {formatCurrency(fee.paid_amount)} of {formatCurrency(fee.amount)}
                                                            {fee.due_date && (
                                                                <span className="ml-2">· Due {new Date(fee.due_date).toLocaleDateString()}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">{formatCurrency(fee.amount - fee.paid_amount)}</p>
                                                        <p className="text-xs text-muted-foreground">Remaining</p>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            fee.status === 'paid' ? 'success' :
                                                            fee.status === 'partial' ? 'warning' :
                                                            fee.status === 'overdue' ? 'warning' : 'destructive'
                                                        }
                                                        className="px-3 py-1.5 text-sm font-medium"
                                                    >
                                                        {fee.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                        {fee.status === 'partial' && <Clock className="h-3 w-3 mr-1" />}
                                                        {(fee.status === 'pending' || fee.status === 'overdue') && <AlertCircle className="h-3 w-3 mr-1" />}
                                                        {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment History */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        <CardTitle>Payment History</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Recent transactions · Academic Year {feeData.academic_year}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {paymentHistory.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No payments recorded for this student yet.</p>
                                        )}
                                        {paymentHistory.map((payment, index) => (
                                            <div
                                                key={payment.id}
                                                className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 hover:shadow-md bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 stagger-${index + 1} animate-slide-up`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20">
                                                        <Receipt className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                                                            <span>·</span>
                                                            <CreditCard className="h-3 w-3" />
                                                            <span>{payment.payment_method}</span>
                                                            {payment.purpose && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span>{payment.purpose}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <Badge variant="success" className="px-3 py-1">
                                                        Success
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">{payment.receipt_number}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
