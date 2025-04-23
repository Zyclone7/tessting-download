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
import { applyReferralIncentives } from "@/actions/referral-incentive";
import { toast } from "@/hooks/use-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  activation_time_left?: string;
  user_referral_code?: string;
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
  }, [userId, user?.id]);

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
        console.error("Error fetching available codes:", err);
        toast({
          title: "Error",
          description: "Failed to fetch available codes. Please try again.",
          variant: "destructive",
        });
      }
    }
    fetchAvailableCodes();
  }, [selectedPackage, userId]);

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
        return <div>{activationTime as string}</div>;
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

// Function to process referral incentives with proper error handling and database storage
const processReferralIncentives = async (
  userId: number,
  uplineId: number,
  userRole: string,
  referralCode?: string
) => {
  console.log("Starting referral incentive processing with params:", {
    userId,
    uplineId,
    userRole,
    referralCode
  });
  
  try {
    // Create a collection to store successful referral generations
    const successfulGenerations: number[] = [];
    let currentGen = 1;
    
    while (true) {
      const endGen = currentGen + 2; // Process 3 generations at a time
      
      console.log(`Processing generations ${currentGen} to ${endGen}`);
      
      const result = await applyReferralIncentives(
        uplineId,
        userRole,
        userId,
        referralCode,
        currentGen,
        endGen
      );
      
      console.log(`Result for generations ${currentGen} to ${endGen}:`, result);
      
      if (!result.success) {
        console.error("Failed to apply referral incentives:", result);
        throw new Error(
          result.message || "Failed to apply referral incentives"
        );
      }
      
      // Track which generations were successfully processed
      for (let gen = currentGen; gen <= endGen; gen++) {
        successfulGenerations.push(gen);
      }
      
      // Stop if there are no more uplines to process
      if (!result.nextGeneration) {
        console.log("No more generations to process");
        break;
      }
      
      currentGen = result.nextGeneration;
    }
    
    // After all processing is complete, verify we have successful referrals
    if (successfulGenerations.length > 0) {
      console.log(`Successfully processed ${successfulGenerations.length} referral generations: ${successfulGenerations.join(', ')}`);
      
      // Since the applyReferralIncentives function seems to be handling the database operations internally,
      // we don't need to do additional database storage here.
      // If you do need to store additional information, you would create a new function
      // for that purpose and call it here.
    }
    
    console.log("Completed processing all available generations");
    return { success: true, processedCount: successfulGenerations.length };
  } catch (error) {
    console.error("Error processing referral incentives:", error);
    throw error;
  }
};

  // Function to handle the activation process with proper sequencing
  const handleActivateAccount = async () => {
    if (!selectedUserId || !selectedCode) {
      toast({
        title: "Error",
        description: "Missing user ID or activation code.",
        variant: "destructive",
      });
      return;
    }

    setProcessingAction(true);
    try {
      // Step 1: Update user status
      const updateUserData = {
        ID: selectedUserId,
        user_status: 1
      };
      console.log("Updating user profile:", updateUserData);
      const profileUpdateResult = await updateProfile(updateUserData);
      
      if (!profileUpdateResult || !profileUpdateResult.success) {
        throw new Error("Failed to update user profile");
      }
      
      // Step 2: Mark the code as redeemed
      console.log("Setting code as redeemed:", selectedCode, "by user:", selectedUserId);
      const redeemResult = await setRedeemedBy(selectedCode, selectedUserId.toString());
      
      if (!redeemResult || !redeemResult.success) {
        throw new Error("Failed to set code as redeemed");
      }
      
      // Step 3: Get the activated user details
      const activatedUser = members.find(member => member.ID === selectedUserId);
      
      if (activatedUser && activatedUser.user_upline_id) {
        // Step 4: Process referral incentives
        console.log("Processing referral incentives for user:", selectedUserId);
        await processReferralIncentives(
          selectedUserId,
          activatedUser.user_upline_id,
          activatedUser.user_role,
          activatedUser.user_referral_code
        );
        
        toast({
          title: "Success",
          description: "Account activated and referral incentives processed successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Partial Success",
          description: "Account activated but no referral information found.",
          variant: "default",
        });
      }
      
      // Reset UI state
      setSelectedCode(undefined);
      setClicked(false);
      setIsDialogOpen(false);
      
      // Refresh the members list to show updated status
      if (user?.id) {
        const response = await getAllRegisteredUser(user.id) as OrganizationResponse;
        if (response.success && response.data) {
          setMembers(response.data);
        }
      }
      
    } catch (error) {
      console.error("Error during activation process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate account.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  

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
        if (!open) setClicked(false);
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
                        {(selectedPackage as string).replace(/_/g, " ")}:
                      </DialogDescription>
                    </div>
                    <div>
                      <Button 
                          variant="outline"
                          disabled={processingAction}
                      >
                          Select available codes
                      </Button>  
                    </div> 
                   </div>
                 </DropdownMenuTrigger>
                    <DropdownMenuContent className="mr-56" style={{width:'175px' }}>
                      {codes
                      .filter((code) => {
                        return selectedPackage === code.package;
                      })
                      .map((code) => (
                        <DropdownMenuItem 
                          key={`${code.user_id}-${code.id}`}
                          onClick={() => {
                            setSelectedCode(code.code);                 
                          }}                      
                        >   
                        {code.code}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>      
               </DropdownMenu>
             )}
          { selectedCode && (
          <Dialog open={true} onOpenChange={(open) => {
            if (!open) setSelectedCode(undefined);
          }}>
            <DialogContent>
              <DialogTitle>{selectedCode}</DialogTitle>
              <DialogDescription>
                  Are you sure you want to use this activation code for this account?
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