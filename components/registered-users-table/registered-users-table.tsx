"use client";

import { useEffect, useState } from "react";
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllRegisteredUser, updateProfile } from "@/actions/user";
import { getInvitationCodeByCodeforRegister } from "@/actions/invitation-codes";
import { getAvailableCodes } from "@/actions/invitation-codes";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserContext } from "@/hooks/use-user";
import { setRedeemedBy } from "@/actions/invitation-codes";
import { toast } from "@/hooks/use-toast";// Ensure you have a toast hook or component
import { applyReferralIncentives } from "@/actions/referral-incentive";
import RegisteredUserDialog from "./registered-user-dialog";

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
import { AnimatePresence, motion } from "framer-motion";
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
  error?: any;
}

interface AvailableCodes {
  user_id: number;
  id: number;
  code: string;
  package: string;
  error?: any; // Add this to your interface
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
  const [activating, setActivating] = useState(false);
  const [processingReferrals, setProcessingReferrals] = useState(false);

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
    fetchMembers(); activateUserWithReferral
  }, [userId]);

  // Then add these functions inside your RegisteredUsersTable component
  const processReferralIncentives = async (
    userId: number,
    uplineId: number,
    userRole: string,
    referralCode: string
  ) => {
    console.log("Starting referral incentive processing with params:", {
      userId,
      uplineId,
      userRole,
      referralCode
    });

    try {
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
        // Stop if there are no more uplines to process
        if (!result.nextGeneration) {
          console.log("No more generations to process");
          break;
        }
        currentGen = result.nextGeneration;
      }
      console.log("Completed processing all available generations");
      return { success: true };
    } catch (error) {
      console.error("Error processing referral incentives:", error);
      throw error;
    }
  };

  const applyReferralCode = async (referralCode: string) => {
    if (referralCode.length !== 10) {
      return {
        success: false,
        error: "Invalid code format"
      };
    }
    try {
      const result = await getInvitationCodeByCodeforRegister(referralCode);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "Invalid activation code"
        };
      }

      // Ensure user_level is not null, default to 0 if it is
      const userLevel = result.data.user_level ?? 0;

      return {
        success: true,
        data: {
          user_role: result.data.user_role,
          user_upline_id: result.data.user_id,
          user_level: userLevel + 1
        }
      };
    } catch (error) {
      console.error("Error applying referral code:", error);
      return {
        success: false,
        error: "Failed to apply referral code"
      };
    }
  };

  // Add this function before activateUserWithReferral
  const fetchInvitationCodeDetails = async (
    referralCode: string
  ): Promise<{
    user_id: number;
    user_level: number;
    user_role: string;
  } | null> => {
    try {
      const result = await getInvitationCodeByCodeforRegister(referralCode);

      if (!result.success || !result.data) {
        return null;
      }

      return {
        user_id: result.data.user_id ?? 0,
        user_level: result.data.user_level ?? 0,
        user_role: result.data.user_role
      };
    } catch (error) {
      console.error("Error fetching invitation code details:", error);
      return null;
    }
  };

  const activateUserWithReferral = async (
    userId: number,
    activationCode: string,
    referralCode: string,
  ) => {
    try {
      // Step 1: Basic validation
      if (!referralCode || referralCode.trim().length !== 10) {
        throw new Error("Valid referral code is required");
      }

      // Step 2: Fetch referral code details
      const codeDetails = await fetchInvitationCodeDetails(referralCode);
      if (!codeDetails) {
        throw new Error("Invalid referral code");
      }

      // Step 3: Update user data with upline information and activate
      const updateUserData = {
        ID: userId,
        user_status: 1,
        user_upline_id: codeDetails.user_id,
        user_level: codeDetails.user_level + 1,
        user_role: codeDetails.user_role
      };

      // Step 4: Update the user profile
      const updateResult = await updateProfile(updateUserData);
      if (!updateResult.success) {
        throw new Error(updateResult.message || "Failed to update user profile");
      }

      // Step 5: Mark the activation code as redeemed
      const redeemResult = await setRedeemedBy(activationCode, userId.toString());
      if (!redeemResult.success) {
        throw new Error(redeemResult.error || "Failed to redeem activation code");
      }

      // Step 6: Process referral incentives
      await processReferralIncentives(
        userId,
        updateUserData.user_upline_id,
        updateUserData.user_role,
        referralCode
      );

      return {
        success: true,
        message: "User activated successfully with referral incentives applied",
        userId
      };
    } catch (error) {
      console.error("Error in activation with referral:", error);
      return {
        success: false,
        error
      };
    }
  };

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

  const handleActivateAccount = (userId: number) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
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
            handleActivateAccount(numberUserId);
            setSelectedPackage(selectedpckg);
          }}
          >
            Activate this account
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
        if (!open) setClicked(false);
      }}>
        <DialogContent className="w-full max-w-[50rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold ml-4">Merchant/Distributor Details</DialogTitle>
            <DialogDescription className="ml-4 mt-2 mb-6">Please review the user details below</DialogDescription>
          </DialogHeader>
          <div className="mb-6">
            {selectedUserId && <RegisteredUserDialog userId={selectedUserId as number} />}
          </div>
          <AnimatePresence mode="wait">
            {clicked === false ? (
              <motion.div
                key="activate-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogFooter className="mt-4 mr-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    onClick={() => setClicked(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Activate this account
                  </Button>
                </DialogFooter>
              </motion.div>
            ) : (
              <motion.div
                key="code-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4 ml-4">
                  <DialogDescription className="text-gray-600">
                    {(selectedPackage as string).replace(/_/g, " ")}:
                  </DialogDescription>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                        Select available codes
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full bg-white shadow-lg rounded-md">
                      {codes.filter((code) => selectedPackage === code.package).length > 0 ? (
                        codes
                          .filter((code) => selectedPackage === code.package)
                          .map((code) => (
                            <DropdownMenuItem
                              key={`${code.user_id}-${code.id}`}
                              onClick={() => setSelectedCode(code.code)}
                              className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                            >
                              {code.code}
                            </DropdownMenuItem>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No Available Codes
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {selectedCode && (
            <Dialog open={true} onOpenChange={(open) => {
              if (!open) setSelectedCode(undefined);
            }}>
              <DialogContent className="sm:max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DialogTitle className="text-xl font-semibold">{selectedCode}</DialogTitle>
                  <DialogDescription className="mt-2 mb-6">
                    Are you sure you want to use this activation code for this account?
                  </DialogDescription>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          setActivating(true);
                          if (!selectedCode || !selectedUserId) {
                            throw new Error("Missing activation code or user ID");
                          }
                          const referralCode = selectedCode;
                          const result = await activateUserWithReferral(
                            selectedUserId,
                            selectedCode,
                            referralCode
                          );
                          if (result.success) {
                            setSelectedCode(undefined);
                            setClicked(false);
                            setIsDialogOpen(false);
                            setProcessingReferrals(true);
                            setTimeout(async () => {
                              setProcessingReferrals(false);
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
                                toast({
                                  title: "Account activated",
                                  description: "Activation successful with referral incentives applied.",
                                  variant: "default",
                                });
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'An error occurred');
                                toast({
                                  title: "Error refreshing data",
                                  description: "Failed to refresh user list after activation.",
                                  variant: "destructive",
                                });
                              }
                            }, 5000);
                          } else {
                            throw new Error(result.message);
                          }
                        } catch (error) {
                          console.error("Error during activation:", error);
                          toast({
                            title: "Activation failed",
                            variant: "destructive",
                          });
                        } finally {
                          setActivating(false);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {activating ? 'Processing...' : 'Confirm'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCode(undefined)}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </DialogContent>
      </Dialog>
      {/* Referral Processing Dialog */}
      <Dialog open={processingReferrals} onOpenChange={() => { }}>
        <DialogContent className="w-full max-w-[30rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Processing Referrals</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <DialogDescription className="text-center">
              Please wait while referral incentives are being processed...
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredUsersTable;