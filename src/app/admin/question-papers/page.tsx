"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    FileText,
    Download,
    Printer,
    Search,
    Filter,
    MoreVertical,
    Eye,
    File,
    Calendar,
    User,
    GraduationCap
} from 'lucide-react'

interface QuestionPaper {
    id: string
    name: string
    subject: string
    class: string
    uploadedBy: string
    uploadedAt: Date
    fileType: 'pdf' | 'doc' | 'docx'
    fileSize: number
}

// Sample data
const samplePapers: QuestionPaper[] = [
    {
        id: '1',
        name: 'Mathematics Mid-Term Exam 2024',
        subject: 'Mathematics',
        class: 'Class 10',
        uploadedBy: 'Mr. Sharma',
        uploadedAt: new Date('2024-01-15'),
        fileType: 'pdf',
        fileSize: 2457600
    },
    {
        id: '2',
        name: 'Science Quarterly Test',
        subject: 'Science',
        class: 'Class 9',
        uploadedBy: 'Ms. Priya',
        uploadedAt: new Date('2024-01-20'),
        fileType: 'docx',
        fileSize: 1843200
    },
    {
        id: '3',
        name: 'English Literature Final Exam',
        subject: 'English',
        class: 'Class 12',
        uploadedBy: 'Mr. Das',
        uploadedAt: new Date('2024-01-25'),
        fileType: 'pdf',
        fileSize: 3145728
    },
    {
        id: '4',
        name: 'History Unit Test - Chapter 5',
        subject: 'History',
        class: 'Class 11',
        uploadedBy: 'Mrs. Gupta',
        uploadedAt: new Date('2024-01-28'),
        fileType: 'doc',
        fileSize: 1536000
    },
    {
        id: '5',
        name: 'Physics Practice Paper',
        subject: 'Physics',
        class: 'Class 12',
        uploadedBy: 'Mr. Kumar',
        uploadedAt: new Date('2024-01-30'),
        fileType: 'pdf',
        fileSize: 2867200
    },
]

export default function QuestionPapersPage() {
    const [papers] = useState<QuestionPaper[]>(samplePapers)
    const [searchQuery, setSearchQuery] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('all')
    const [classFilter, setClassFilter] = useState('all')

    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            paper.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSubject = subjectFilter === 'all' || paper.subject === subjectFilter
        const matchesClass = classFilter === 'all' || paper.class === classFilter
        return matchesSearch && matchesSubject && matchesClass
    })

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return <File className="h-5 w-5 text-red-500" />
            case 'doc':
            case 'docx':
                return <File className="h-5 w-5 text-blue-500" />
            default:
                return <FileText className="h-5 w-5 text-gray-500" />
        }
    }

    const getFileTypeBadge = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">PDF</Badge>
            case 'doc':
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">DOC</Badge>
            case 'docx':
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">DOCX</Badge>
            default:
                return <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
        }
    }

    const handleDownload = (paper: QuestionPaper) => {
        // Simulate download
        const link = document.createElement('a')
        link.href = '#'
        link.download = paper.name + '.' + paper.fileType
        link.click()
        console.log(`Downloading: ${paper.name}`)
    }

    const handlePrint = (paper: QuestionPaper) => {
        // Simulate print - in real app, would open print dialog for the document
        console.log(`Printing: ${paper.name}`)
        window.print()
    }

    const handleView = (paper: QuestionPaper) => {
        // Simulate view - in real app, would open document in new tab or modal
        console.log(`Viewing: ${paper.name}`)
    }

    const subjects = [...new Set(papers.map(p => p.subject))]
    const classes = [...new Set(papers.map(p => p.class))]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Question Papers
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Access and manage all uploaded question papers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm py-1.5 px-3">
                        <FileText className="h-4 w-4 mr-2" />
                        {papers.length} Papers
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{papers.length}</p>
                                <p className="text-sm text-muted-foreground">Total Papers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                <File className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{papers.filter(p => p.fileType === 'pdf').length}</p>
                                <p className="text-sm text-muted-foreground">PDF Files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                                <File className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{papers.filter(p => p.fileType === 'doc' || p.fileType === 'docx').length}</p>
                                <p className="text-sm text-muted-foreground">Word Files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{subjects.length}</p>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or uploader..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Papers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Question Papers Library</CardTitle>
                    <CardDescription>View, download, and print question papers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[40%]">Document</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Uploaded By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPapers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                            <p className="text-muted-foreground">No question papers found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPapers.map((paper) => (
                                        <TableRow key={paper.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(paper.fileType)}
                                                    <div>
                                                        <p className="font-medium">{paper.name}</p>
                                                        <div className="mt-1">
                                                            {getFileTypeBadge(paper.fileType)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{paper.subject}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <GraduationCap className="h-4 w-4" />
                                                    <span>{paper.class}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <User className="h-4 w-4" />
                                                    <span>{paper.uploadedBy}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{paper.uploadedAt.toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatFileSize(paper.fileSize)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleView(paper)}
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                                        onClick={() => handleDownload(paper)}
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                        onClick={() => handlePrint(paper)}
                                                        title="Print"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-100 group-hover:opacity-0 absolute right-4"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleView(paper)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownload(paper)}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePrint(paper)}>
                                                            <Printer className="h-4 w-4 mr-2" />
                                                            Print
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
                </CardContent>
            </Card>
        </div>
    )
}
