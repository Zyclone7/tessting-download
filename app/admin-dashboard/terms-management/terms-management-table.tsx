"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, MoveUp, MoveDown, Eye } from "lucide-react"
import { getAllTerms, createTerm, updateTerm, deleteTerm, reorderTerm } from "@/actions/terms-and-data-policy"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import type { Term } from "@/types/types"
import { PreviewTermsDialog } from "./preview-terms-dialog"

export function TermsManagementTable() {
    const router = useRouter()
    const [terms, setTerms] = useState<Term[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [currentTerm, setCurrentTerm] = useState<Term | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        content: "",
    })

    // Fetch terms on component mount
    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const result = await getAllTerms()
                setTerms(result.terms)
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load terms data",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchTerms()
    }, [])

    const handleOpenDialog = (term?: Term) => {
        if (term) {
            setCurrentTerm(term)
            setFormData({
                title: term.title,
                content: term.content,
            })
        } else {
            setCurrentTerm(null)
            setFormData({
                title: "",
                content: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handleOpenDeleteDialog = (term: Term) => {
        setCurrentTerm(term)
        setIsDeleteDialogOpen(true)
    }

    const handleSubmit = async () => {
        try {
            if (currentTerm) {
                // Update existing term
                await updateTerm({
                    term_id: currentTerm.term_id,
                    title: formData.title,
                    content: formData.content,
                })
                toast({
                    title: "Success",
                    description: "Term updated successfully",
                })
            } else {
                // Create new term
                await createTerm({
                    title: formData.title,
                    content: formData.content,
                })
                toast({
                    title: "Success",
                    description: "New term created successfully",
                })
            }

            // Refresh data and close dialog
            const result = await getAllTerms()
            setTerms(result.terms)
            setIsDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({
                title: "Error",
                description: currentTerm ? "Failed to update term" : "Failed to create term",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async () => {
        if (!currentTerm) return

        try {
            await deleteTerm(currentTerm.term_id)
            toast({
                title: "Success",
                description: "Term deleted successfully",
            })

            // Refresh data and close dialog
            const result = await getAllTerms()
            setTerms(result.terms)
            setIsDeleteDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete term",
                variant: "destructive",
            })
        }
    }

    const handleReorder = async (termId: number, direction: "up" | "down") => {
        try {
            await reorderTerm(termId, direction)

            // Refresh data
            const result = await getAllTerms()
            setTerms(result.terms)
            router.refresh()

            toast({
                title: "Success",
                description: "Term order updated",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reorder term",
                variant: "destructive",
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Loading terms data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Terms Sections</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Preview
                    </Button>
                    <Button onClick={() => handleOpenDialog()} className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Add New Section
                    </Button>
                </div>
            </div>

            {terms.length === 0 ? (
                <div className="text-center py-10 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">No terms sections found. Create your first section.</p>
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Order</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="w-[200px]">Last Updated</TableHead>
                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {terms.map((term, index) => (
                                    <motion.tr
                                        key={term.term_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        className="border-b"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{index + 1}</span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === 0}
                                                        onClick={() => handleReorder(term.term_id, "up")}
                                                    >
                                                        <MoveUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === terms.length - 1}
                                                        onClick={() => handleReorder(term.term_id, "down")}
                                                    >
                                                        <MoveDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{term.title}</div>
                                            <div className="text-sm text-muted-foreground truncate max-w-[400px]">
                                                {term.content.substring(0, 100)}...
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(term.updated_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(term)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDeleteDialog(term)}
                                                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentTerm ? "Edit Term Section" : "Create New Term Section"}</DialogTitle>
                        <DialogDescription>
                            {currentTerm
                                ? "Update the details of this terms and conditions section."
                                : "Add a new section to your terms and conditions."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Section Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Introduction and Account Responsibilities"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Enter the section content..."
                                className="min-h-[200px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>{currentTerm ? "Update Section" : "Create Section"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this section? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            {isPreviewOpen && <PreviewTermsDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} terms={terms} />}
        </div>
    )
}
