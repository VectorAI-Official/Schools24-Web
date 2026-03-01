"use client"

import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { Search, Plus, Package, AlertTriangle, CheckCircle, XCircle, Download, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { InventoryItem } from '@/types'
import { useCreateInventoryItem, useDeleteInventoryItem, useInventoryItems, useUpdateInventoryItem } from '@/hooks/useInventory'
import { toast } from 'sonner'

export default function InventoryPage() {
    const { user, isLoading, userRole } = useAuth()
    const searchParams = useSearchParams()
    const schoolId = searchParams.get('school_id') || undefined
    const isSuperAdmin = userRole === 'super_admin'
    const canLoad = !!user && !isLoading && (!isSuperAdmin || !!schoolId)

    const {
        data: inventoryPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInventoryItems(schoolId, 20, { enabled: canLoad })
    const inventory = useMemo(
        () => inventoryPages?.pages.flatMap(page => page.items) || [],
        [inventoryPages]
    )
    const createInventoryItem = useCreateInventoryItem(schoolId)
    const deleteInventoryItem = useDeleteInventoryItem(schoolId)
    const updateInventoryItem = useUpdateInventoryItem(schoolId)

    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newItem, setNewItem] = useState({ name: '', category: 'Stationery', quantity: 0, unit: 'pcs', minStock: 10, location: '' })
    const [editItem, setEditItem] = useState<InventoryItem | null>(null)

    const categories = [...new Set(inventory.map(item => item.category))]

    const tableContainerRef = useRef<HTMLDivElement | null>(null)

    const handleTableScroll = () => {
        const el = tableContainerRef.current
        if (!el || !hasNextPage || isFetchingNextPage) return

        const scrollThreshold = el.scrollHeight * 0.8
        const currentPosition = el.scrollTop + el.clientHeight

        if (currentPosition >= scrollThreshold) {
            fetchNextPage()
        }
    }

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const lowStockItems = inventory.filter(item => item.status === 'low-stock').length
    const outOfStockItems = inventory.filter(item => item.status === 'out-of-stock').length

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Location', 'Status'].join(','),
            ...inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.minStock, i.location, i.status].join(','))
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'inventory.csv'
        a.click()
        toast.success('Export completed', { description: 'Inventory exported to CSV.' })
    }

    const handleAddItem = async () => {
        if (!newItem.name) {
            toast.error('Please enter item name')
            return
        }
        try {
            await createInventoryItem.mutateAsync(newItem)
            setNewItem({ name: '', category: 'Stationery', quantity: 0, unit: 'pcs', minStock: 10, location: '' })
            setIsAddDialogOpen(false)
        } catch (error) {
            // Error handled by mutation
        }
    }

    const handleDeleteItem = async (item: InventoryItem) => {
        try {
            await deleteInventoryItem.mutateAsync(item.id)
        } catch (error) {
            // Error handled by mutation
        }
    }

    const handleEditClick = (item: InventoryItem) => {
        setEditItem(item)
        setIsEditDialogOpen(true)
    }

    const handleUpdateItem = async () => {
        if (!editItem || !editItem.name) {
            toast.error('Please enter item name')
            return
        }
        try {
            await updateInventoryItem.mutateAsync({
                id: editItem.id,
                name: editItem.name,
                category: editItem.category,
                quantity: editItem.quantity,
                unit: editItem.unit,
                minStock: editItem.minStock,
                location: editItem.location,
            })
            setIsEditDialogOpen(false)
            setEditItem(null)
        } catch (error) {
            // Error handled by mutation
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Resource Inventory</h1>
                    <p className="text-muted-foreground">Manage school resources and supplies</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Item</DialogTitle>
                                <DialogDescription>Add a new item to inventory.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Item Name *</Label>
                                    <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Enter item name" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Stationery">Stationery</SelectItem>
                                                <SelectItem value="Electronics">Electronics</SelectItem>
                                                <SelectItem value="Furniture">Furniture</SelectItem>
                                                <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Location</Label>
                                        <Input value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} placeholder="Store Room A" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Unit</Label>
                                        <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pcs">pcs</SelectItem>
                                                <SelectItem value="boxes">boxes</SelectItem>
                                                <SelectItem value="sets">sets</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Min Stock</Label>
                                        <Input type="number" value={newItem.minStock} onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddItem}>Add Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Item Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Item</DialogTitle>
                                <DialogDescription>Update inventory item details.</DialogDescription>
                            </DialogHeader>
                            {editItem && (
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Item Name *</Label>
                                        <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="Enter item name" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Category</Label>
                                            <Select value={editItem.category} onValueChange={(v) => setEditItem({ ...editItem, category: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Stationery">Stationery</SelectItem>
                                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Location</Label>
                                            <Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} placeholder="Store Room A" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Quantity</Label>
                                            <Input type="number" value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Unit</Label>
                                            <Select value={editItem.unit} onValueChange={(v) => setEditItem({ ...editItem, unit: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pcs">pcs</SelectItem>
                                                    <SelectItem value="boxes">boxes</SelectItem>
                                                    <SelectItem value="sets">sets</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Min Stock</Label>
                                            <Input type="number" value={editItem.minStock} onChange={(e) => setEditItem({ ...editItem, minStock: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateItem}>Update Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inventory.length}</p>
                                <p className="text-sm text-muted-foreground">Total Items</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inventory.filter(i => i.status === 'in-stock').length}</p>
                                <p className="text-sm text-muted-foreground">In Stock</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{lowStockItems}</p>
                                <p className="text-sm text-muted-foreground">Low Stock</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{outOfStockItems}</p>
                                <p className="text-sm text-muted-foreground">Out of Stock</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        ref={tableContainerRef}
                        onScroll={handleTableScroll}
                        className="max-h-[520px] overflow-auto"
                    >
                        <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Min Stock</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.category}</Badge>
                                    </TableCell>
                                    <TableCell>{item.quantity} {item.unit}</TableCell>
                                    <TableCell>{item.minStock} {item.unit}</TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>{item.lastUpdated}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            item.status === 'in-stock' ? 'success' :
                                                item.status === 'low-stock' ? 'warning' : 'destructive'
                                        }>
                                            {item.status === 'in-stock' ? 'In Stock' :
                                                item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
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
                                                <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                                {isFetchingNextPage && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            Loading more items...
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                        </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
