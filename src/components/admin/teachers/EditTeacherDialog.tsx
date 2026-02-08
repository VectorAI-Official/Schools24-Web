"use client"

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Teacher {
    id: string
    name: string
    email: string
    phone: string
    employeeId: string
    department: string
    designation?: string
    qualification?: string
    qualifications?: string[]
    subjects?: string[]
    subjects_taught?: string[]
    experience: string
    experience_years?: number
    salary: number
    joinDate?: string
    hire_date?: string
}

interface EditTeacherDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacher: Teacher | null
    onSave: (id: string, data: any) => void
}

export function EditTeacherDialog({ open, onOpenChange, teacher, onSave }: EditTeacherDialogProps) {
    const [formData, setFormData] = useState({
        // Professional Info
        employee_id: '',
        department: '',
        designation: '',
        hire_date: '',

        // Qualifications & Subjects
        qualifications: [] as string[],
        subjects_taught: [] as string[],
        experience_years: 0,

        // Personal & Salary
        full_name: '',
        email: '',
        phone: '',
        salary: 0,
    })

    const [newQualification, setNewQualification] = useState('')
    const [newSubject, setNewSubject] = useState('')

    useEffect(() => {
        if (teacher) {
            setFormData({
                employee_id: teacher.employeeId || '',
                department: teacher.department || '',
                designation: teacher.designation || '',
                hire_date: teacher.hire_date ? teacher.hire_date.split('T')[0] : (teacher.joinDate ? teacher.joinDate.split('T')[0] : ''),

                qualifications: teacher.qualifications || (teacher.qualification ? teacher.qualification.split(',').map(q => q.trim()).filter(Boolean) : []),
                subjects_taught: teacher.subjects_taught || teacher.subjects || [],
                experience_years: teacher.experience_years || parseInt(teacher.experience) || 0,

                full_name: teacher.name || '',
                email: teacher.email || '',
                phone: teacher.phone || '',
                salary: teacher.salary || 0,
            })
        }
    }, [teacher])

    const handleAddQualification = () => {
        if (newQualification.trim()) {
            setFormData({
                ...formData,
                qualifications: [...formData.qualifications, newQualification.trim()]
            })
            setNewQualification('')
        }
    }

    const handleRemoveQualification = (index: number) => {
        setFormData({
            ...formData,
            qualifications: formData.qualifications.filter((_, i) => i !== index)
        })
    }

    const handleAddSubject = () => {
        if (newSubject.trim()) {
            setFormData({
                ...formData,
                subjects_taught: [...formData.subjects_taught, newSubject.trim()]
            })
            setNewSubject('')
        }
    }

    const handleRemoveSubject = (index: number) => {
        setFormData({
            ...formData,
            subjects_taught: formData.subjects_taught.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = () => {
        if (!teacher?.id) return

        // Validate mandatory fields
        if (!formData.full_name || !formData.email || !formData.employee_id || !formData.department) {
            toast.error('Please fill in all required fields')
            return
        }

        const payload = {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            employee_id: formData.employee_id,
            department: formData.department,
            designation: formData.designation || undefined,
            qualifications: formData.qualifications.length > 0 ? formData.qualifications : undefined,
            subjects_taught: formData.subjects_taught.length > 0 ? formData.subjects_taught : undefined,
            experience_years: formData.experience_years || 0,
            hire_date: formData.hire_date || undefined,
            salary: formData.salary || 0,
        }

        onSave(teacher.id, payload)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Edit Teacher Details</DialogTitle>
                    <DialogDescription>
                        Update all teacher information.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="professional" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="professional">Professional Info</TabsTrigger>
                        <TabsTrigger value="qualifications">Qualifications & Subjects</TabsTrigger>
                        <TabsTrigger value="personal">Personal & Salary</TabsTrigger>
                    </TabsList>

                    {/* --- PROFESSIONAL INFO --- */}
                    <TabsContent value="professional" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Employee ID *</Label>
                                <Input
                                    value={formData.employee_id}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Department *</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(val) => setFormData({ ...formData, department: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Arts'].map(d => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Designation</Label>
                                <Input
                                    value={formData.designation}
                                    placeholder="e.g., Senior Teacher, Head of Department"
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Hire Date</Label>
                                <Input
                                    type="date"
                                    value={formData.hire_date}
                                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- QUALIFICATIONS & SUBJECTS --- */}
                    <TabsContent value="qualifications" className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Qualifications</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newQualification}
                                    placeholder="e.g., M.Sc. Mathematics, B.Ed"
                                    onChange={(e) => setNewQualification(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQualification())}
                                />
                                <Button type="button" onClick={handleAddQualification}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.qualifications.map((qual, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                        {qual}
                                        <button
                                            onClick={() => handleRemoveQualification(index)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Subjects Taught</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newSubject}
                                    placeholder="e.g., Algebra, Geometry"
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                                />
                                <Button type="button" onClick={handleAddSubject}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.subjects_taught.map((subject, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                        {subject}
                                        <button
                                            onClick={() => handleRemoveSubject(index)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Experience (Years)</Label>
                            <Input
                                type="number"
                                value={formData.experience_years}
                                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                min="0"
                            />
                        </div>
                    </TabsContent>

                    {/* --- PERSONAL & SALARY --- */}
                    <TabsContent value="personal" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Full Name *</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email (Login) *</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    placeholder="+91 98765 43210"
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Salary (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                                    min="0"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
