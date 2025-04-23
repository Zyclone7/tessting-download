"use client";

import { useEffect, useState } from "react";
import RegisteredUserDialog from "./registered-user-dialog"; // Adjust the import path as necessary
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllRegisteredUser, updateProfile } from "@/actions/user";
import { getAvailableCodes } from "@/actions/invitation-codes";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserContext } from "@/hooks/use-user";
import { setRedeemedBy } from "@/actions/invitation-codes";
import { toast } from "@/hooks/use-toast";// Ensure you have a toast hook or component
import { applyReferralIncentives } from "@/actions/referral-incentive";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  ID: number;
  user_nicename: string;
  user_email: string;
  user_role: string;
  user_upline_id: number;
  business_name: string;
  business_address: string;
  user_status: number;
  user_registered: Date;
  activation_time_left?: string; // Optional field to store the formatted remaining time
}

interface OrganizationResponse {
  success: boolean;
  data?: Member[];
  error?: string;
}

interface AvailableCodes {
  user_id: number;
  id: number;
  code: string;
  package: string;
  redeemed_by: number | null
}

const RegisteredUsersTable = ({ userId }: { userId: number }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { user } = useUserContext();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [codes, setCodes] = useState<AvailableCodes[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [clicked, setClicked] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>();
  const [processingAction, setProcessingAction] = useState(false);



  useEffect(() => {
    async function fetchMembers() {
      try {
        if (user?.id === undefined) {
          throw new Error('User ID is undefined');
        }
        const response = await getAllRegisteredUser(user.id) as OrganizationResponse;

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch members');
        }

        const updatedMembers = response.data.map((member) => {
          const registrationDate = new Date(member.user_registered);
          const currentDate = new Date();
          const daysPassed = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 3600 * 24));

          return { ...member, days_left_to_activated: 30 - daysPassed };
        });

        setMembers(updatedMembers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }

    }
    fetchMembers();
  
  }, [userId]);

  // Function to update the countdown for each member
  const updateCountdown = () => {
    if (!isDialogOpen) {  // Only update countdown if the dialog is closed
      setMembers((prevMembers) => {
        return prevMembers.map((member) => {
          const registrationDate = new Date(member.user_registered);
          const currentDate = new Date();
          const timeDiff = currentDate.getTime() - registrationDate.getTime();
          const remainingMillis = Math.max(0, 30 * 24 * 60 * 60 * 1000 - timeDiff); // Ensure no negative time

          const daysLeft = Math.floor(remainingMillis / (1000 * 3600 * 24));
          const hoursLeft = Math.floor((remainingMillis % (1000 * 3600 * 24)) / (1000 * 3600));
          const minutesLeft = Math.floor((remainingMillis % (1000 * 3600)) / (1000 * 60));
          const secondsLeft = Math.floor((remainingMillis % (1000 * 60)) / 1000);

          const activationTimeLeft = remainingMillis > 0
            ? `${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`
            : "Expired";

          return { ...member, activation_time_left: activationTimeLeft };
        });
      });
    }
  };

  
  // Use interval to update the countdown every second
  useEffect(() => {
    const intervalId = setInterval(updateCountdown, 1000);

    // Cleanup the interval when the component unmounts or when the countdown is no longer needed
    return () => clearInterval(intervalId);
  }, [isDialogOpen]);  // Re-run the effect when dialog open state changes

  const handleViewUserDetails = (userId: number) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);  // Open dialog and stop countdown
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);  // Close dialog and resume countdown
    updateCountdown();  // Immediately update the countdown when dialog is closed
  };

  useEffect(() => {
    async function fetchAvailableCodes() {
      try {
          if (selectedPackage) {
            const response = await getAvailableCodes(userId, selectedPackage);
            if (Array.isArray(response) && response.length > 0) {
              setCodes(response as AvailableCodes[]);
            }
          }  
      } catch (err) {
        console.error(err);
      }
    }
    fetchAvailableCodes();
  }, [selectedPackage, userId]);

// Enhanced handleActivateAccount function with better error handling and logging

const handleActivateAccount = async () => {
  try {
    setProcessingAction(true);
    
    // Verify selectedUserId
    if (selectedUserId === null) {
      toast({
        title: "Activation failed",
        description: "No user selected for activation.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Activating user with ID:", selectedUserId);
    console.log("Current members in state:", members);
    
    // Enhanced user finding with type conversion and better error handling
    const selectedUser = members.find(member => Number(member.ID) === Number(selectedUserId));
    
    if (!selectedUser) {
      console.error("User not found. Selected ID:", selectedUserId);
      console.error("Available IDs:", members.map(m => m.ID));
      
      // Try to refresh the members list before failing
      if (user?.id) {
        console.log("Attempting to refresh members list...");
        const response = await getAllRegisteredUser(user.id) as OrganizationResponse;
        if (response.success && response.data) {
          const refreshedMembers = response.data;
          setMembers(refreshedMembers);
          
          // Try finding the user again in the refreshed list
          const refreshedUser = refreshedMembers.find(member => Number(member.ID) === Number(selectedUserId));
          if (refreshedUser) {
            console.log("User found after refresh:", refreshedUser);
            // Continue with the refreshed user
            await processActivation(refreshedUser);
            return;
          }
        }
      }
      
      toast({
        title: "Activation failed",
        description: "Selected user not found in member list. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    await processActivation(selectedUser);
    
  } catch (error) {
    console.error("Error during activation:", error);
    toast({
      title: "Activation failed",
      description: "There was an error activating the account. Please check console for details.",
      variant: "destructive",
    });
  } finally {
    setProcessingAction(false);
  }
};

// Helper function to process the activation once we have the user
const processActivation = async (selectedUser: Member) => {
  if (!selectedCode) {
    toast({
      title: "Activation failed", 
      description: "No activation code selected.",
      variant: "destructive",
    });
    return;
  }

  // Update the user profile first to set status as active
  const updateUserData = {
    ID: selectedUser.ID, // Use the ID from the found user
    user_status: 1
  };
  
  await updateProfile(updateUserData);
  console.log("User profile updated successfully");
  
  // Check if user has an upline ID before applying referral incentives
  if (selectedUser.user_upline_id) {
    console.log("Applying referral incentives with params:", {
      uplineId: selectedUser.user_upline_id,
      packageName: selectedUser.user_role,
      userId: selectedUser.ID,
      code: selectedCode
    });
    
    // Apply referral incentives after activation
    const incentiveResult = await applyReferralIncentives(
      selectedUser.user_upline_id,
      selectedUser.user_role,
      selectedUser.ID,
      selectedCode
    );
    
    console.log("Referral incentives applied:", incentiveResult);
  } else {
    console.log("No upline ID found for this user, skipping referral incentives");
  }
  
  // Update the code status
  await setRedeemedBy(selectedCode, String(selectedUser.ID));
  console.log("Code marked as redeemed");
  
  // Reset states and show success message
  setSelectedCode(undefined);
  setClicked(false);
  toast({
    title: "Account activated",
    description: "Account activated successfully.",
    variant: "default",
  });
  setIsDialogOpen(false);
  
  // Refresh the member list to show updated status
  if (user?.id) {
    const response = await getAllRegisteredUser(user.id) as OrganizationResponse;
    if (response.success && response.data) {
      setMembers(response.data);
    }
  }
};

  const columns: ColumnDef<Member>[] = [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user_nicename",
      header: "Name",
    },
    {
      accessorKey: "business_name",
      header: "Business Name",
    },
    {
      accessorKey: "business_address",
      header: "Business Address",
    },
    {
      accessorKey: "user_role",
      header: "Selected Package",
      cell: ({ row }) => {
        const info = row.getValue("user_role");
        return info ? <div>{(info as string).replace(/_/g, " ")}</div> : <div> </div>;
      },
    },
    {
      accessorKey: "user_registered",
      header: "Date Registered",
      cell: ({ row }) => {
        const date: any = row.getValue("user_registered");
        return <div>{date ? new Date(date).toLocaleDateString() : " "}</div>;
      },
    },
    {
      accessorKey: "activation_time_left",
      header: "Time Left to Activate",
      cell: ({ row }) => {
        const activationTime = row.getValue("activation_time_left");
        return <div>{activationTime as string}</div>; // Ensure this line returns the value
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const userId = row.original.ID;
        const numberUserId = Number(userId);
        const selectedpckg = row.original.user_role;
 
        return (
          <Button onClick={() => {
            handleViewUserDetails(numberUserId);
            setSelectedPackage(selectedpckg);
          }}
          >
            View User Details
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    // Core configurations
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Sorting/filtering configurations
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Initial state
    initialState: {
      pagination: {
        pageSize: 10, // Set default page size here
      },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      // Remove pagination from state
    },
  });

  // Update page handlers
  const handlePreviousPage = () => table.previousPage();
  const handleNextPage = () => table.nextPage();

  const exportToCSV = () => {
    if (members.length === 0) return; // Avoid exporting empty data
    const headers = columns.map((column) => column.header as string).join(",");
    const csvData = members
      .map((member, index) =>
        columns
          .map((column) => {
            let value: any;
            if ('accessorKey' in column && member[column.accessorKey as keyof Member]) {
              value = member[column.accessorKey as keyof Member];
            } else if ('accessorFn' in column) {
              value = column.accessorFn(member, index);
            } else {
              value = '';
            }
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      )
      .join("\n");

    const csvContent = `${headers}\n${csvData}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "registeredUsers.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const SkeletonRow = () => (
    <TableRow>
      {columns.map((column, index) => (
        <TableCell key={index}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search"
          value={(table.getColumn("user_nicename")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("user_nicename")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
        Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setClicked(false);
          setSelectedCode(undefined);
        }
      }}>
        <DialogContent className="w-full max-w-[50rem]">
            <DialogTitle className="text-2xl font-bold ml-4 mb-[-13px]">Merchant/Distributor Details</DialogTitle>
          <DialogDescription className="ml-4 mb-5">Please review the user-details below</DialogDescription>
          {selectedUserId && <RegisteredUserDialog userId={selectedUserId as number} />}
          
             {clicked === false ? (
              <DialogFooter className="mt-4 mr-4">
                <div>
                    <Button 
                    type="submit"
                    disabled={loading}
                    onClick={() => setClicked(true)}
                    >
                    Activate this account
                    </Button> 
                </div>
              </DialogFooter>
             ) : (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <div className="pl-4 flex items-center">
                    <div style={{width:'161px' }}>
                      <DialogDescription>
                        {selectedPackage ? (selectedPackage as string).replace(/_/g, " ") : "Select package"}:
                      </DialogDescription>
                    </div>
                    <div>
                      <Button 
                          variant="outline"
                      >
                          {selectedCode ? selectedCode : "Select available codes"}
                      </Button>  
                    </div> 
                   </div>
                 </DropdownMenuTrigger>
                    <DropdownMenuContent className="mr-56" style={{width:'175px' }}>
                      {codes.length > 0 ? (
                        codes
                        .filter((code) => selectedPackage === code.package && !code.redeemed_by)
                        .map((code) => (
                          <DropdownMenuItem 
                            key={`${code.user_id}-${code.id}`}
                            onClick={() => setSelectedCode(code.code)}                      
                          >   
                          {code.code}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>No codes available</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>      
               </DropdownMenu>
             )}
          { selectedCode && (
          <Dialog open={true} onOpenChange={(open) => {
            if (!open) setSelectedCode(undefined);
          }}>
            <DialogContent>
              <DialogTitle>Confirm Activation</DialogTitle>
              <DialogDescription>
                  Are you sure you want to use code <strong>{selectedCode}</strong> to activate this account?
              </DialogDescription>
              <DialogFooter>
              <Button 
                onClick={handleActivateAccount}
                disabled={processingAction}
              >
                {processingAction ? "Processing..." : "Confirm"}
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCode(undefined)}
                  disabled={processingAction}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </DialogContent>
       
      </Dialog>
    </div>
              
  );
};

export default RegisteredUsersTable;