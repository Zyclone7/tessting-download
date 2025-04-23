'use client'

import { useState, useEffect, useMemo, Key, ComponentType, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
} from '@tanstack/react-table'
import { getUsersAdmin, UserRole } from '@/actions/user'
import { columns } from './columns'
import { UserTableFilters } from './user-table-filters'
import { UserStatistics } from './user-statistics'
import { UserDialog } from './user-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminUpdateUser } from "@/actions/user"

export function UserAdminTable() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const table: any = useReactTable({
    data: allData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const data: any = useMemo(() => {
    table.setPageCount(Math.ceil(allData.length / table.getState().pagination.pageSize))
    return allData.slice(
      table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
    )
  }, [allData, table.getState().pagination.pageIndex, table.getState().pagination.pageSize])

  const fetchData = async (filters: any = {}, sorting: SortingState = []) => {
    setLoading(true)
    try {
      const users = await getUsersAdmin(filters, sorting)
      setAllData(users)
      table.setPageIndex(0) // Reset to the first page when new data is loaded
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  const handleRowClick = (user: any) => {
    setSelectedUser(user)
  }

  const handleUserUpdate = async (updatedUser: any) => {
    try {
      // Call the server action
      const result = await adminUpdateUser(updatedUser)

    if (result.success) {
      // Update the user in the allData array
      setAllData(prevData => 
        prevData.map(user => 
          user.ID === updatedUser.ID ? updatedUser : user
        )
      )
      // Update the selected user
      setSelectedUser(updatedUser)
      toast({
        title: 'Success',
        description: 'User updated successfully.',
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error("Error updating user:", error)
    toast({
      title: 'Error',
      description: 'Failed to update user. Please try again.',
      variant: 'destructive',
    })
    throw error
  }

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <UserTableFilters
          onFilterChange={(filters) => fetchData(filters, sorting)}
        />
        <Button onClick={handleRefresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <UserStatistics data={allData} />
      <motion.div
        key={table.getState().pagination.pageIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: { id: Key | null | undefined; headers: any[] }) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Loading...
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="wait">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row: { id: Key | null | undefined; getIsSelected: () => any; original: any; getVisibleCells: () => { id: Key | null | undefined; column: { columnDef: { cell: string | number | bigint | boolean | ComponentType<any> | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined } }; getContext: () => any }[] }) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        layout
                        className={`${row.getIsSelected() ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50`}
                        onClick={() => handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell: { id: Key | null | undefined; column: { columnDef: { cell: string | number | bigint | boolean | ComponentType<any> | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined } }; getContext: () => any }) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium">Page</p>
            <input
              type="number"
              min={1}
              max={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="w-16 rounded-md border px-2 py-1 text-sm"
            />
            <p className="text-sm font-medium">of {table.getPageCount()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      {selectedUser && (
        <UserDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </motion.div>
  )
}