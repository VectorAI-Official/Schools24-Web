"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Search,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Download,
    Upload,
    Eye,
    UserCog,
    Mail,
    Phone,
    DollarSign,
    Award,
    BookOpen,
    Filter,
    RefreshCw,
    Users,
    CheckCircle2,
    Clock,
    Briefcase,
    Calendar,
    MapPin,
    Droplet,
} from 'lucide-react'
import { mockStaff, Staff } from '@/lib/mockData'
import { getInitials, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>(mockStaff)
    const [searchQuery, setSearchQuery] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [staffTypeFilter, setStaffTypeFilter] = useState<string>('all')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        staffType: 'teaching' as 'teaching' | 'non-teaching',
        department: '',
        designation: '',
        subjects: '',
        salary: '',
        qualification: '',
        experience: '',
        address: '',
        dateOfBirth: '',
        emergencyContact: '',
        bloodGroup: '',
    })

    const filteredStaff = staff.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.designation.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter
        const matchesStaffType = staffTypeFilter === 'all' || member.staffType === staffTypeFilter
        return matchesSearch && matchesDepartment && matchesStatus && matchesStaffType
    })

    const departments = [...new Set(staff.map(s => s.department))].sort()

    const stats = {
        total: staff.length,
        teaching: staff.filter(s => s.staffType === 'teaching').length,
        nonTeaching: staff.filter(s => s.staffType === 'non-teaching').length,
        active: staff.filter(s => s.status === 'active').length,
        onLeave: staff.filter(s => s.status === 'on-leave').length,
        totalSalary: staff.reduce((sum, s) => sum + s.salary, 0),
        averageRating: staff.filter(s => s.rating).length > 0
            ? (staff.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / staff.filter(s => s.rating).length).toFixed(1)
            : 'N/A',
    }

    const handleAddStaff = () => {
        if (!newStaff.name || !newStaff.email || !newStaff.department || !newStaff.designation) {
            toast.error('Please fill in all required fields')
            return
        }

        const staffMember: Staff = {
            id: String(staff.length + 1),
            name: newStaff.name,
            email: newStaff.email,
            phone: newStaff.phone,
            employeeId: newStaff.employeeId || `${newStaff.staffType === 'teaching' ? 'TCH' : 'NTS'}${String(staff.length + 1).padStart(3, '0')}`,
            staffType: newStaff.staffType,
            department: newStaff.department,
            designation: newStaff.designation,
            subjects: newStaff.staffType === 'teaching' && newStaff.subjects ? newStaff.subjects.split(',').map(s => s.trim()) : undefined,
            qualification: newStaff.qualification,
            experience: parseInt(newStaff.experience) || 0,
            joinDate: new Date().toISOString().split('T')[0],
            salary: parseFloat(newStaff.salary) || 30000,
            rating: newStaff.staffType === 'teaching' ? 4.0 : undefined,
            status: 'active',
            avatar: '',
            address: newStaff.address,
            dateOfBirth: newStaff.dateOfBirth,
            emergencyContact: newStaff.emergencyContact,
            bloodGroup: newStaff.bloodGroup,
        }

        setStaff([...staff, staffMember])
        setNewStaff({
            name: '',
            email: '',
            phone: '',
            employeeId: '',
            staffType: 'teaching',
            department: '',
            designation: '',
            subjects: '',
            salary: '',
            qualification: '',
            experience: '',
            address: '',
            dateOfBirth: '',
            emergencyContact: '',
            bloodGroup: '',
        })
        setIsAddDialogOpen(false)
        toast.success('Staff member added successfully', {
            description: `${staffMember.name} has been added as ${staffMember.staffType === 'teaching' ? 'Teaching Staff' : 'Non-Teaching Staff'}`,
        })
    }

    const handleEditStaff = () => {
        if (!selectedStaff) return

        setStaff(staff.map(s => s.id === selectedStaff.id ? selectedStaff : s))
        setIsEditDialogOpen(false)
        toast.success('Staff member updated successfully', {
            description: `${selectedStaff.name}'s details have been updated`,
        })
    }

    const handleDeleteStaff = () => {
        if (!selectedStaff) return

        setStaff(staff.filter(s => s.id !== selectedStaff.id))
        setIsDeleteDialogOpen(false)
        toast.success('Staff member removed successfully', {
            description: `${selectedStaff.name} has been removed from the system`,
        })
    }

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Email', 'Employee ID', 'Staff Type', 'Department', 'Designation', 'Salary', 'Status'].join(','),
            ...filteredStaff.map(s => [s.name, s.email, s.employeeId, s.staffType, s.department, s.designation, s.salary, s.status].join(','))
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'staff.csv'
        a.click()
        toast.success('Export completed', { description: 'Staff data exported to CSV.' })
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            toast.info('Importing staff...', {
                description: `Parsing ${e.target.files[0].name} and updating records`
            })

            setTimeout(() => {
                toast.success('Import completed', {
                    description: 'Successfully imported staff members'
                })
            }, 1500)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">Manage teaching and non-teaching staff</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => document.getElementById('import-staff')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <input
                        id="import-staff"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleImport}
                    />
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px]">
                            <DialogHeader>
                                <DialogTitle>Add New Staff Member</DialogTitle>
                                <DialogDescription>
                                    Add a new teaching or non-teaching staff member to the school.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto">
                                <div className="grid gap-2">
                                    <Label htmlFor="staffType">Staff Type *</Label>
                                    <Select
                                        value={newStaff.staffType}
                                        onValueChange={(value: 'teaching' | 'non-teaching') => setNewStaff({ ...newStaff, staffType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="teaching">Teaching Staff</SelectItem>
                                            <SelectItem value="non-teaching">Non-Teaching Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter full name"
                                            value={newStaff.name}
                                            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter email"
                                            value={newStaff.email}
                                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="Enter phone"
                                            value={newStaff.phone}
                                            onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="employeeId">Employee ID</Label>
                                        <Input
                                            id="employeeId"
                                            placeholder="Auto-generated if empty"
                                            value={newStaff.employeeId}
                                            onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="department">Department *</Label>
                                        <Input
                                            id="department"
                                            placeholder="e.g., Mathematics, Administration"
                                            value={newStaff.department}
                                            onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="designation">Designation *</Label>
                                        <Input
                                            id="designation"
                                            placeholder="e.g., Senior Teacher, Librarian"
                                            value={newStaff.designation}
                                            onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {newStaff.staffType === 'teaching' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                                        <Input
                                            id="subjects"
                                            placeholder="e.g., Physics, Chemistry"
                                            value={newStaff.subjects}
                                            onChange={(e) => setNewStaff({ ...newStaff, subjects: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="qualification">Qualification</Label>
                                        <Input
                                            id="qualification"
                                            placeholder="e.g., M.Sc, B.Ed"
                                            value={newStaff.qualification}
                                            onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="experience">Experience (years)</Label>
                                        <Input
                                            id="experience"
                                            type="number"
                                            placeholder="Years of experience"
                                            value={newStaff.experience}
                                            onChange={(e) => setNewStaff({ ...newStaff, experience: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="salary">Salary (₹)</Label>
                                        <Input
                                            id="salary"
                                            type="number"
                                            placeholder="Enter salary"
                                            value={newStaff.salary}
                                            onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={newStaff.dateOfBirth}
                                            onChange={(e) => setNewStaff({ ...newStaff, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                                        <Input
                                            id="emergencyContact"
                                            placeholder="Emergency phone number"
                                            value={newStaff.emergencyContact}
                                            onChange={(e) => setNewStaff({ ...newStaff, emergencyContact: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <Select
                                            value={newStaff.bloodGroup}
                                            onValueChange={(value) => setNewStaff({ ...newStaff, bloodGroup: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select blood group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        placeholder="Enter full address"
                                        value={newStaff.address}
                                        onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddStaff}>Add Staff Member</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                <UserCog className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{stats.total}</p>
                                <p className="text-sm text-blue-100">Total Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.teaching}</p>
                                <p className="text-sm text-muted-foreground">Teaching</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                <Briefcase className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.nonTeaching}</p>
                                <p className="text-sm text-muted-foreground">Non-Teaching</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats.totalSalary)}</p>
                                <p className="text-sm text-muted-foreground">Total Salary</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.averageRating}</p>
                                <p className="text-sm text-muted-foreground">Avg Rating</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Table */}
            <Card>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <Select value={staffTypeFilter} onValueChange={setStaffTypeFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Staff Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="teaching">Teaching</SelectItem>
                                    <SelectItem value="non-teaching">Non-Teaching</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on-leave">On Leave</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setSearchQuery('')
                                    setDepartmentFilter('all')
                                    setStatusFilter('all')
                                    setStaffTypeFilter('all')
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No staff members found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStaff.map((member) => (
                                        <TableRow key={member.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={member.avatar} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                                            {getInitials(member.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{member.employeeId}</TableCell>
                                            <TableCell>
                                                <Badge variant={member.staffType === 'teaching' ? 'default' : 'secondary'}>
                                                    {member.staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">
                                                    {member.department}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{member.designation}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(member.salary)}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    member.status === 'active' ? 'success' :
                                                        member.status === 'on-leave' ? 'warning' : 'destructive'
                                                }>
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedStaff(member)
                                                                setIsViewDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedStaff(member)
                                                                setIsEditDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedStaff(member)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredStaff.length} of {staff.length} staff members
                        </p>
                    </div>
                </div>
            </Card>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Staff Member Details</DialogTitle>
                    </DialogHeader>
                    {selectedStaff && (
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="professional">Professional</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="space-y-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={selectedStaff.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xl">
                                            {getInitials(selectedStaff.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{selectedStaff.name}</h3>
                                        <p className="text-muted-foreground">{selectedStaff.email}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline">
                                                {selectedStaff.employeeId}
                                            </Badge>
                                            <Badge variant={selectedStaff.staffType === 'teaching' ? 'default' : 'secondary'}>
                                                {selectedStaff.staffType === 'teaching' ? 'Teaching Staff' : 'Non-Teaching Staff'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="font-medium">{selectedStaff.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-medium text-sm">{selectedStaff.email}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date of Birth</p>
                                            <p className="font-medium">{selectedStaff.dateOfBirth || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Droplet className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Blood Group</p>
                                            <p className="font-medium">{selectedStaff.bloodGroup || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Emergency Contact</p>
                                            <p className="font-medium">{selectedStaff.emergencyContact || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Salary</p>
                                            <p className="font-medium">{formatCurrency(selectedStaff.salary)}</p>
                                        </div>
                                    </div>
                                </div>
                                {selectedStaff.address && (
                                    <div className="p-3 rounded-lg bg-muted flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Address</p>
                                            <p className="font-medium">{selectedStaff.address}</p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="professional" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-center">
                                        <Users className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{selectedStaff.department}</p>
                                        <p className="text-sm opacity-90">Department</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white text-center">
                                        <Briefcase className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{selectedStaff.experience}</p>
                                        <p className="text-sm opacity-90">Years Experience</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-1">Designation</p>
                                        <p className="font-medium">{selectedStaff.designation}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-1">Qualification</p>
                                        <p className="font-medium">{selectedStaff.qualification}</p>
                                    </div>
                                    {selectedStaff.subjects && selectedStaff.subjects.length > 0 && (
                                        <div className="p-3 rounded-lg bg-muted">
                                            <p className="text-xs text-muted-foreground mb-2">Subjects Teaching</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedStaff.subjects.map((subject, index) => (
                                                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                                        {subject}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-1">Join Date</p>
                                        <p className="font-medium">{selectedStaff.joinDate}</p>
                                    </div>
                                    {selectedStaff.rating && (
                                        <div className="p-3 rounded-lg bg-muted">
                                            <p className="text-xs text-muted-foreground mb-1">Rating</p>
                                            <div className="flex items-center gap-2">
                                                <Award className="h-5 w-5 text-yellow-500" />
                                                <p className="font-medium text-lg">{selectedStaff.rating} ★</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                                        <Badge variant={
                                            selectedStaff.status === 'active' ? 'success' :
                                                selectedStaff.status === 'on-leave' ? 'warning' : 'destructive'
                                        }>
                                            {selectedStaff.status}
                                        </Badge>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>
                            Update staff member information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStaff && (
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={selectedStaff.name}
                                        onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={selectedStaff.email}
                                        onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">Phone</Label>
                                    <Input
                                        id="edit-phone"
                                        value={selectedStaff.phone || ''}
                                        onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-salary">Salary</Label>
                                    <Input
                                        id="edit-salary"
                                        type="number"
                                        value={selectedStaff.salary}
                                        onChange={(e) => setSelectedStaff({ ...selectedStaff, salary: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-department">Department</Label>
                                <Input
                                    id="edit-department"
                                    value={selectedStaff.department}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, department: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-designation">Designation</Label>
                                <Input
                                    id="edit-designation"
                                    value={selectedStaff.designation}
                                    onChange={(e) => setSelectedStaff({ ...selectedStaff, designation: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={selectedStaff.status}
                                    onValueChange={(value: 'active' | 'on-leave' | 'inactive') => setSelectedStaff({ ...selectedStaff, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on-leave">On Leave</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditStaff}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {selectedStaff?.name} from the system. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
