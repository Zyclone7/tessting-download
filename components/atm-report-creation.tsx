"use client";

import { useCallback, useState, useEffect, memo } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  IconCircleCheck,
  IconUpload,
  IconFileTypeCsv,
  IconLoader2,
  IconEdit,
  IconCopy,
  IconClipboard,
  IconFileTypeXls,
} from "@tabler/icons-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Edit, Trash2 } from 'lucide-react';
import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";
import { createAtmTransactions } from "@/actions/atm-transaction";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AtmReportCreationProps {
  onUploadComplete: () => void;
}

const AtmReportCreation = ({ onUploadComplete }: AtmReportCreationProps) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [ifEditable, setIfEditable] = useState<boolean>(false);
  const [isPending, setIsPending] = useState(false);
  const [date, setDate] = useState<{
    year: number;
    month: number;
    day: number;
  }>(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  }));
  const router = useRouter();

  const parseRawData = (rawText: string) => {
    Papa.parse(rawText, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        processResults(results);
      },
      error: (error: any) => {
        console.error("Error parsing data:", error);
        toast({
          title: "Error",
          description: "Failed to parse pasted data",
          variant: "destructive",
        });
      },
    });
  };

  const processResults = (results: any) => {
    const rawData = results.data;
    const validTransactions: any[] = [];
    let headerRow: string[] = [];
    let merchants: { id: string; name: string }[] = [];
    let currentMerchantIndex = -1;

    // First pass: extract all merchant IDs and names
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const firstCell = row[0]?.toString() || "";

      if (firstCell.includes("Merchant ID:")) {
        const idMatch = firstCell.match(/Merchant ID:(\d+)/);
        if (idMatch) {
          currentMerchantIndex++;
          merchants.push({ id: idMatch[1].trim(), name: "" });
          
          // Check if name is on same line (after newline)
          const parts = firstCell.split("\n");
          if (parts.length > 1) {
            const nameLine: string | undefined = parts.find((p: string) => p.includes("Merchant Name:"));
            if (nameLine) {
              merchants[currentMerchantIndex].name = nameLine.replace("Merchant Name:", "").trim();
              // Get the next line if it exists (actual name)
              const nameIndex = parts.indexOf(nameLine);
              if (nameIndex < parts.length - 1) {
                merchants[currentMerchantIndex].name = parts[nameIndex + 1].replace(/"/g, "").trim();
              }
            }
          }
        }
      }
      // If we're in a merchant block and find the name
      else if (firstCell.includes("Merchant Name:") && currentMerchantIndex >= 0) {
        // Get the next row as it contains the actual name
        if (i + 1 < rawData.length) {
          merchants[currentMerchantIndex].name = rawData[i + 1][0]?.toString().replace(/"/g, "").trim() || "";
        }
      }
    }

    // Second pass: find header row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      // Store header row when found
      if (row.some((cell: string) =>
        cell?.includes("Date") ||
        cell?.includes("Cash In") ||
        cell?.includes("Withdraw") ||
        cell?.includes("Bill Payment"))) {
        headerRow = row.map((cell: string) => cell?.trim() || "");
        break;
      }
    }

    // Find column indices from header
    const findColumnIndex = (keyword: string, startFrom: number = 0) => {
      return headerRow.findIndex((cell, index) =>
        index >= startFrom && cell?.includes(keyword)
      );
    };

    // Get count and amount column indices
    const columns = {
      cashIn: {
        count: findColumnIndex("Cash In"),
        amount: findColumnIndex("Cash In", findColumnIndex("Cash In") + 1)
      },
      withdraw: {
        count: findColumnIndex("Withdraw"),
        amount: findColumnIndex("Withdraw", findColumnIndex("Withdraw") + 1)
      },
      billPayment: {
        count: findColumnIndex("Bill Payment"),
        amount: findColumnIndex("Bill Payment", findColumnIndex("Bill Payment") + 1)
      },
      balanceInquiry: {
        count: findColumnIndex("Balance Inquiry"),
        amount: findColumnIndex("Balance Inquiry", findColumnIndex("Balance Inquiry") + 1)
      },
      fundTransfer: {
        count: findColumnIndex("Fund Transfer"),
        amount: findColumnIndex("Fund Transfer", findColumnIndex("Fund Transfer") + 1)
      },
      total: {
        count: findColumnIndex("Total"),
        amount: findColumnIndex("Total", findColumnIndex("Total") + 1)
      },
      fees: {
        rcbc: findColumnIndex("Tran Fee(RCBC)"),
        merchant: findColumnIndex("Tran Fee(Merchant)")
      }
    };

    // Third pass: process transaction rows
    currentMerchantIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const firstCell = row[0]?.toString() || "";

      if (firstCell.includes("Merchant ID:")) {
        currentMerchantIndex++;
        continue;
      }

      if (
        row[1] &&
        typeof row[1] === "string" &&
        row[1].match(/\d{1,2}-\w{3}/) &&
        !row[1].includes("TOTAL") &&
        currentMerchantIndex >= 0
      ) {
        const dateStr = `${row[1]}-2024`;
        const parsedDate = parse(dateStr, "dd-MMM-yyyy", new Date());
        const formattedDate = format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss");

        const parseValue = (index: number) =>
          index >= 0 && row[index] ? parseFloat(row[index].toString().replace(/,/g, '')) || 0 : 0;

        const transactionData = {
          merchant_id: merchants[currentMerchantIndex].id,
          merchant_name: merchants[currentMerchantIndex].name,
          transaction_date: formattedDate,
          cash_in_count: parseValue(columns.cashIn.count),
          withdraw_count: parseValue(columns.withdraw.count),
          bill_payment_count: parseValue(columns.billPayment.count),
          balance_inquiry_count: parseValue(columns.balanceInquiry.count),
          fund_transfer_count: parseValue(columns.fundTransfer.count),
          total_transaction_count: parseValue(columns.total.count),
          cash_in_amount: parseValue(columns.cashIn.amount),
          withdraw_amount: parseValue(columns.withdraw.amount),
          bill_payment_amount: parseValue(columns.billPayment.amount),
          balance_inquiry_amount: parseValue(columns.balanceInquiry.amount),
          fund_transfer_amount: parseValue(columns.fundTransfer.amount),
          total_amount: parseValue(columns.total.amount),
          transaction_fee_rcbc: parseValue(columns.fees.rcbc),
          transaction_fee_merchant: parseValue(columns.fees.merchant),
          status: "unverified",
        };

        validTransactions.push(transactionData);
      }
    }

    if (validTransactions.length > 0) {
      const firstTransactionDate = new Date(
        validTransactions[0].transaction_date
      );
      setDate({
        year: firstTransactionDate.getFullYear(),
        month: firstTransactionDate.getMonth() + 1,
        day: firstTransactionDate.getDate(),
      });
    }

    setEmployees(validTransactions);
    console.log("Processed transactions:", validTransactions);

    if (validTransactions.length > 0) {
      toast({
        title: "Success",
        description: "Data processed successfully",
      });
    } else {
      toast({
        title: "Failed",
        description: "Data is in the wrong format",
        variant: "destructive",
      });
    }
  };



  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFileName(file.name);
        if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const csvData = XLSX.utils.sheet_to_csv(firstSheet);
              Papa.parse(csvData, {
                header: false,
                skipEmptyLines: true,
                complete: processResults,
                error: (error: any) => {
                  console.error("Error parsing Excel:", error);
                  toast({
                    title: "Error",
                    description: "Failed to parse Excel file",
                    variant: "destructive",
                  });
                },
              });
            } catch (error) {
              console.error("Error reading Excel file:", error);
              toast({
                title: "Error",
                description: "Failed to read Excel file",
                variant: "destructive",
              });
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: processResults,
            error: (error: any) => {
              console.error("Error parsing CSV:", error);
              toast({
                title: "Error",
                description: "Failed to parse CSV file",
                variant: "destructive",
              });
            },
          });
        }
      }
    },
    [date.year]
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text) {
        e.preventDefault();
        parseRawData(text);
        setFileName("Pasted Data");
        toast({
          title: "Processing",
          description: "Processing pasted data...",
        });
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [date.year]);

  const handleDelete = useCallback((index: number) => {
    setEmployees((prevEmployees) => {
      const updatedEmployees = [...prevEmployees];
      updatedEmployees.splice(index, 1);
      return updatedEmployees;
    });
  }, []);

  const handleDateChange = (field: "year" | "month" | "day", value: number) => {
    setDate((prevDate) => {
      const newDate = { ...prevDate, [field]: value };
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) => {
          const currentDate = new Date(employee.transaction_date);
          const updatedDate = new Date(
            newDate.year,
            newDate.month - 1,
            Math.min(
              newDate.day,
              new Date(newDate.year, newDate.month, 0).getDate()
            ),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          );
          return {
            ...employee,
            transaction_date: isNaN(updatedDate.getTime())
              ? employee.transaction_date
              : format(updatedDate, "yyyy-MM-dd'T'HH:mm:ss"),
          };
        })
      );
      return newDate;
    });
  };

  const handleCreateAccounts = async () => {
    setLoading(true);
    setIsPending(true);
    try {
      const result = await createAtmTransactions(employees);
      if (result.success) {
        toast({
          title: "ATM Transactions Created",
          description:
            result.message ||
            `Successfully created ${result.count} ATM Transactions.${
              result.skippedCount
                ? ` Skipped ${result.skippedCount} duplicates.`
                : ""
            }`,
        });
        setSubmitted(true);
        onUploadComplete();
        setIsPending(false);
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        if (result.error?.includes("duplicates")) {
          toast({
            title: "Duplicate Transactions",
            description: result.error,
            variant: "destructive",
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("Error creating transactions:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction accounts",
        variant: "destructive",
      });
      setIsPending(false);
    } finally {
      setLoading(false);
      setIsPending(false);
    }
  };

  const handleIfEdit = () => {
    setIfEditable((prev) => !prev);
  };

  const sanitizeValue = (value: number) => {
    return isNaN(value) || value === null ? 0 : value;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  const EmployeeCard = memo(
    ({ employee, index, ifEditable, handleDelete }: any) => {
      return (
        <Card key={index} className="border">
          <CardContent className="p-4 space-y-4">
            <div className="p-4 lg:p-6 space-y-6">
              {/* Merchant Information */}
              <div className="space-y-4">
                <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">
                  Merchant Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Merchant ID
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-1.5 px-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                        {employee.merchant_id}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          navigator.clipboard.writeText(employee.merchant_id);
                          toast({
                            title: "Copied!",
                            description: "Merchant ID copied to clipboard",
                            duration: 2000,
                          });
                        }}
                      >
                        <IconCopy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Merchant Name
                    </h3>
                    <p className="text-lg font-semibold break-words">
                      {employee.merchant_name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Transaction Date
                  </h3>
                  <p className="text-lg font-semibold">
                    {format(
                      new Date(employee.transaction_date),
                      "MMMM dd, yyyy"
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Transaction Counts */}
              <div className="space-y-4">
                <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">
                  Transaction Counts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {[
                    { label: "Cash In", count: employee.cash_in_count ?? 0 },
                    {
                      label: "Bill Payment",
                      count: employee.bill_payment_count ?? 0,
                    },
                    { label: "Withdraw", count: employee.withdraw_count },
                    {
                      label: "Balance Inquiry",
                      count: employee.balance_inquiry_count,
                    },
                    {
                      label: "Fund Transfer",
                      count: employee.fund_transfer_count,
                    },
                    {
                      label: "Total Transaction",
                      count: employee.total_transaction_count,
                    },
                  ].map((item) => (
                    <Card
                      key={item.label}
                      className="p-3 lg:p-4 hover:bg-accent transition-colors"
                    >
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {item.label}
                      </h3>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-xl lg:text-2xl font-bold">
                          {item.count}
                        </p>
                        <Badge
                          variant={item.count > 0 ? "default" : "secondary"}
                        >
                          transactions
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Transaction Amounts */}
              <div className="space-y-4">
                <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">
                  Transaction Amounts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {[
                    { label: "Cash In", amount: employee.cash_in_amount ?? 0 },
                    {
                      label: "Bill Payment",
                      amount: employee.bill_payment_amount ?? 0,
                    },
                    { label: "Withdraw", amount: employee.withdraw_amount },
                    { label: "Fund Transfer", amount: employee.fund_transfer_amount },
                    { label: "Total Amount", amount: employee.total_amount },
                  ].map((item) => (
                    <Card
                      key={item.label}
                      className="p-3 lg:p-4 hover:bg-accent transition-colors"
                    >
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {item.label}
                      </h3>
                      <p className="text-xl lg:text-2xl font-bold tabular-nums break-words">
                        ₱
                        {item.amount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Fees */}
              <div className="space-y-4">
                <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">
                  Transaction Fees
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  {[
                    {
                      label: "RCBC Fee",
                      amount: employee.transaction_fee_rcbc,
                    },
                    {
                      label: "Merchant Fee",
                      amount: employee.transaction_fee_merchant,
                    },
                  ].map((item) => (
                    <Card
                      key={item.label}
                      className="p-3 lg:p-4 hover:bg-accent transition-colors"
                    >
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {item.label}
                      </h3>
                      <p className="text-xl lg:text-2xl font-bold tabular-nums break-words">
                        ₱
                        {sanitizeValue(item.amount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          {/* Card Footer */}
          {ifEditable && (
            <CardFooter className="flex flex-wrap justify-end space-y-2 sm:space-y-0 sm:space-x-2 p-4">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(index)}
                className="w-full sm:w-auto text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </CardFooter>
          )}
        </Card>
      );
    }
  );
  EmployeeCard.displayName = "EmployeeCard";

  return (
    <div className="h-[calc(100vh-5rem)] bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-[50vh] p-6"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <IconCircleCheck className="w-24 h-24 text-green-500 mb-6" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h1 className="text-4xl font-bold text-primary mb-4">
                  Success!
                </h1>
                <p className="text-xl text-muted-foreground">
                  {isPending
                    ? "Creating accounts..."
                    : "All accounts have been successfully created."}
                </p>
              </motion.div>
            </div>
            {isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <IconLoader2 className="animate-spin h-10 w-10 mt-8 text-primary" />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div
            className={cn(
              "container mx-auto px-4 py-6 h-full overflow-hidden",
              loading && "pointer-events-none opacity-50"
            )}
          >
            <div className="mx-auto h-full">
              <div
                className={cn(
                  "grid gap-6 h-full",
                  employees.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"
                )}
              >
                <div className="space-y-6 overflow-y-auto pr-4 h-full">
                  <div className="space-y-4">
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-bold tracking-tight"
                    >
                      ATM Report Upload
                    </motion.h1>
                    <p className="text-muted-foreground">
                      Upload your ATM transaction report to create and manage
                      accounts.
                    </p>

                    {/* Progress Steps */}
                    <div className="relative mt-8 z-10">
                      <div className="flex justify-between mb-4">
                        {[1, 2, 3].map((step) => (
                          <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: step * 0.1 }}
                            className="flex flex-col items-center"
                          >
                            <div
                              className={cn(
                                "w-10 h-10 z-50 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                step === 1 ||
                                  (employees.length > 0 && step === 2) ||
                                  (loading && step === 3)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {step}
                            </div>
                            <span className="mt-2 text-sm font-medium">
                              {step === 1
                                ? "Upload"
                                : step === 2
                                ? "Verify"
                                : "Submit"}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="absolute top-5 left-0 right-0 flex justify-center z-0">
                        <div className="w-full max-w-[80%] h-[2px] bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                              width:
                                employees.length > 0
                                  ? loading
                                    ? "100%"
                                    : "50%"
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="mt-8 pl-2 space-y-4">
                      <Label
                        htmlFor="file-upload"
                        className="text-base font-semibold"
                      >
                        Upload Report
                      </Label>
                      <div {...getRootProps()} className="relative">
                        <input {...getInputProps()} id="file-upload" />
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "rounded-lg border-2 border-dashed p-8 transition-colors",
                            isDragActive
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/25 hover:border-primary/50",
                            employees.length > 0 &&
                              "border-primary/50 bg-primary/5"
                          )}
                        >
                          <div className="flex flex-col items-center justify-center gap-4">
                            {employees.length > 0 ? (
                              <>
                                <IconFileTypeXls className="h-12 w-12 text-primary" />
                                <div className="text-center">
                                  <p className="text-sm font-medium">
                                    {fileName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Click or drag to replace
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-4">
                                  <IconUpload className="h-12 w-12 text-muted-foreground" />
                                  <IconClipboard className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium">
                                    Drop your file here or click to browse
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Supports CSV, Excel files or paste data
                                    directly
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Date Controls */}
                    {employees.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 mt-8"
                      >
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">
                            Date Settings
                          </h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleIfEdit}
                            className="gap-2"
                          >
                            {ifEditable ? (
                              <>
                                <IconEdit className="h-4 w-4" />
                                Save Changes
                              </>
                            ) : (
                              <>
                                <IconEdit className="h-4 w-4" />
                                Edit Date
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                              type="number"
                              id="year"
                              value={date.year}
                              onChange={(e) =>
                                handleDateChange(
                                  "year",
                                  parseInt(e.target.value, 10) ||
                                    new Date().getFullYear()
                                )
                              }
                              disabled={!ifEditable}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="month">Month</Label>
                            <Input
                              type="number"
                              id="month"
                              min="1"
                              max="12"
                              value={date.month}
                              onChange={(e) =>
                                handleDateChange(
                                  "month",
                                  Math.max(
                                    1,
                                    Math.min(
                                      12,
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  )
                                )
                              }
                              disabled={!ifEditable}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="day">Day</Label>
                            <Input
                              type="number"
                              id="day"
                              min="1"
                              max="31"
                              value={date.day}
                              onChange={(e) =>
                                handleDateChange(
                                  "day",
                                  Math.max(
                                    1,
                                    Math.min(
                                      31,
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  )
                                )
                              }
                              disabled={!ifEditable}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Transaction List */}
                {employees.length > 0 && (
                  <div className="space-y-6 overflow-hidden flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Transactions
                      </h2>
                      <Badge variant="secondary" className="text-sm">
                        {employees.length}{" "}
                        {employees.length === 1 ? "record" : "records"}
                      </Badge>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-grow pr-4">
                      {employees.map((employee, index) => (
                        <EmployeeCard
                          key={index}
                          employee={employee}
                          index={index}
                          ifEditable={ifEditable}
                          handleDelete={handleDelete}
                        />
                      ))}
                    </div>

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4"
                    >
                      <Button
                        className="w-full py-6 text-lg font-semibold shadow-lg"
                        onClick={handleCreateAccounts}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <IconLoader2 className="animate-spin h-5 w-5" />
                            <span>Creating Accounts...</span>
                          </div>
                        ) : (
                          "Create Accounts"
                        )}
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        >
          <div className="fixed inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center gap-4"
            >
              <IconLoader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-lg font-medium">Processing Transactions...</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AtmReportCreation;