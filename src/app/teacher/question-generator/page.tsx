"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Wand2, Copy, Download, RefreshCw, FileText, CheckCircle, Upload, File, X, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UploadedFile {
    id: string
    name: string
    size: number
    type: string
    uploadedAt: Date
}

export default function QuestionGeneratorPage() {
    const [generating, setGenerating] = useState(false)
    const [generated, setGenerated] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleGenerate = () => {
        setGenerating(true)
        setTimeout(() => {
            setGenerating(false)
            setGenerated(true)
        }, 2000)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files)
        }
    }

    const handleFiles = (files: FileList) => {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]

        const validFiles = Array.from(files).filter(file => {
            const isValid = validTypes.includes(file.type) ||
                file.name.endsWith('.pdf') ||
                file.name.endsWith('.doc') ||
                file.name.endsWith('.docx')
            if (!isValid) {
                toast.error(`${file.name} is not a valid format. Only PDF and Word documents are allowed.`)
            }
            return isValid
        })

        if (validFiles.length > 0) {
            setUploading(true)
            // Simulate upload process
            setTimeout(() => {
                const newFiles: UploadedFile[] = validFiles.map(file => ({
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date()
                }))
                setUploadedFiles(prev => [...prev, ...newFiles])
                setUploading(false)
                toast.success(`${validFiles.length} file(s) uploaded successfully!`)
            }, 1500)
        }
    }

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== id))
        toast.success('File removed successfully')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.pdf')) {
            return <File className="h-8 w-8 text-red-500" />
        }
        return <File className="h-8 w-8 text-blue-500" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Question Generator</h1>
                    <p className="text-muted-foreground">AI-powered question generation for assessments</p>
                </div>
            </div>

            {/* Manual Upload Section */}
            <Card className="border-dashed border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>Upload Question Paper</CardTitle>
                            <CardDescription>Manually upload question papers in PDF or Word format</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${dragActive
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            multiple
                            onChange={handleFileInput}
                        />

                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${dragActive
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 scale-110'
                                    : 'bg-muted'
                                }`}>
                                <FileUp className={`h-10 w-10 transition-colors ${dragActive ? 'text-emerald-600' : 'text-muted-foreground'
                                    }`} />
                            </div>

                            <div>
                                <p className="text-lg font-medium">
                                    {dragActive ? 'Drop your files here' : 'Drag & drop your question papers'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    or click to browse from your computer
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                                    PDF
                                </span>
                                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                    DOC
                                </span>
                                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                    DOCX
                                </span>
                            </div>

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="gradient-primary border-0 mt-2"
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose Files
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Uploaded Files ({uploadedFiles.length})
                            </h4>
                            <div className="space-y-2">
                                {uploadedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {getFileIcon(file.name)}
                                            <div>
                                                <p className="font-medium text-sm">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)} • Uploaded {file.uploadedAt.toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeFile(file.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Generator Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Questions</CardTitle>
                        <CardDescription>Configure your question parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="topic">Topic / Subject</Label>
                            <Input id="topic" placeholder="e.g., Quadratic Equations, Photosynthesis" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mathematics">Mathematics</SelectItem>
                                        <SelectItem value="science">Science</SelectItem>
                                        <SelectItem value="english">English</SelectItem>
                                        <SelectItem value="history">History</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="class">Class Level</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="9">Class 9</SelectItem>
                                        <SelectItem value="10">Class 10</SelectItem>
                                        <SelectItem value="11">Class 11</SelectItem>
                                        <SelectItem value="12">Class 12</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Question Type</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                    <SelectItem value="short">Short Answer</SelectItem>
                                    <SelectItem value="long">Long Answer</SelectItem>
                                    <SelectItem value="truefalse">True/False</SelectItem>
                                    <SelectItem value="fillblank">Fill in the Blanks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Number of Questions: 10</Label>
                            <Slider defaultValue={[10]} max={50} step={5} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Difficulty Level</Label>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1">Easy</Button>
                                <Button variant="default" className="flex-1">Medium</Button>
                                <Button variant="outline" className="flex-1">Hard</Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="context">Additional Context (Optional)</Label>
                            <Textarea id="context" placeholder="Provide any additional context or specific areas to focus on" rows={3} />
                        </div>

                        <Button className="w-full gradient-primary border-0" onClick={handleGenerate} disabled={generating}>
                            {generating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generate Questions
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Generated Questions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Generated Questions</CardTitle>
                                <CardDescription>Review and export your questions</CardDescription>
                            </div>
                            {generated && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!generated ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileText className="h-16 w-16 text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground">No questions generated yet</p>
                                <p className="text-sm text-muted-foreground">Configure options and click generate</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <div key={num} className="p-4 rounded-lg border">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                                {num}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium mb-2">
                                                    {num === 1 && "What is the quadratic formula used to solve equations of the form ax² + bx + c = 0?"}
                                                    {num === 2 && "Solve: x² - 5x + 6 = 0"}
                                                    {num === 3 && "If the discriminant of a quadratic equation is negative, what can be said about its roots?"}
                                                    {num === 4 && "Find the sum and product of roots for 2x² - 7x + 3 = 0"}
                                                    {num === 5 && "Which of the following represents a quadratic equation?"}
                                                </p>
                                                {num === 5 && (
                                                    <div className="space-y-2 text-sm">
                                                        <p>A) y = 2x + 1</p>
                                                        <p>B) y = x² - 4x + 4</p>
                                                        <p>C) y = √x</p>
                                                        <p>D) y = 1/x</p>
                                                    </div>
                                                )}
                                            </div>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
