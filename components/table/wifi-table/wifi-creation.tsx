import { useCallback, useState } from "react";
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
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createWifiVouchers } from "@/actions/wifi";

const WifiVoucherCreation = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        transform:(value, header) => header === 'code' ? value.trim() : value.trim(),
        complete: (results: any) => {
          const jsonData = results.data;
          console.log(results.data)

          // Validate required headers
          const requiredHeaders = ['code', 'amount'];
          const missingHeaders = requiredHeaders.filter(h => !results.meta.fields.includes(h))

          // Validate and map the data to the expected format
          const validVouchers = jsonData
            .filter(
              (voucher: any) =>
                voucher.code && voucher.amount
            )
            .map((voucher: any) => {
              return {
                code: voucher.code,
                amount: parseFloat(voucher.amount),
                surfing: voucher.surfing,
                validityDays: voucher.validitydays,
                duration: voucher.duration,
                validityText:voucher.validitytext,
                status: voucher.status,
                note: voucher.note,
                createdAt: voucher.createdat,
              };
            });
            console.log(validVouchers)
          setVouchers(validVouchers);

          // Show appropriate toast notification
          if (validVouchers.length > 0) {
            toast({
              title: "Success",
              description: "CSV uploaded successfully",
            });
          } else {
            toast({
              title: "Failed",
              description: "CSV table is in the wrong format",
              variant: "destructive",
            });
          }
        },
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
  }, []);

  const handleDelete = (index: number) => {
    const updatedVouchers = [...vouchers];
    updatedVouchers.splice(index, 1);
    setVouchers(updatedVouchers);
  };

  const isValidVoucher = (voucher: any) => 
    voucher.code && 
    typeof voucher.amount === 'number'

    const handleCreateVouchers = async () => {
      setLoading(true);
      setWarning(null);
      try {
        const result = await createWifiVouchers(vouchers);
        if (result.success) {
          setLoading(false);
          if (result.warning) {
            setWarning(result.warning);
            toast({
              title: "Partial Success",
              description: result.warning,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Wifi Vouchers Created",
              description: `Successfully created ${result.count} Wifi vouchers.`,
            });
          }
          setSubmitted(true);
          setTimeout(() => {
            router.refresh();
          }, 2000);
        } else {
          throw new Error(result.error || "Failed to create Wfi vouchers");
        }
      } catch (error) {
        setLoading(false);
        console.error("Error creating vouchers:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create Wifi vouchers",
          variant: "destructive",
        });
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { "text/csv": [".csv"] },
    });
  
    const allVouchersValid = vouchers.every(isValidVoucher);

  return (
    <>
      {submitted ? (
        <div className="flex flex-col items-center justify-center h-96">
          <IconCircleCheck className="w-20 h-20 text-green-800 mb-5" />
          <h1 className="text-3xl font-bold text-primary">Accounts Created!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            All updated Wifi Vouchers have been successfully created.
          </p>
        </div>
      ) : (
        <div
          className={`relative ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <div
            className={`mx-auto py-12 main-content h-full w-full mt-5 sm:px-6 lg:px-8 ${
              vouchers.length > 0 ? "grid" : "flex-col"
            } md:grid-cols-2 gap-8`}
          >
            <div className="space-y-4">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">WiFi Pin Uploading</h1>
                <p className="text-muted-foreground">
                  Upload a CSV file containing your voucher information to
                  create accounts for all retailers.
                </p>
                <div className="flex flex-row items-center justify-center w-full max-w-5xl gap-4 mx-auto">
                  <div className="flex flex-col items-center mt-6 ml-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full text-muted font-bold">
                      1
                    </div>
                  </div>
                  <div
                    className={`flex-1 mt-4 w-full h-0.5 ${
                      vouchers.length > 0 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  <div className="flex flex-col items-center mt-6">
                    <div
                      className={`flex items-center justify-center w-10 h-10 ${
                        vouchers.length > 0
                          ? "bg-primary text-muted"
                          : "bg-muted text-muted-foreground"
                      } rounded-full font-bold`}
                    >
                      2
                    </div>
                  </div>
                  <div
                    className={`flex-1 mt-4 w-full h-0.5 ${
                      loading ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  <div className="flex flex-col items-center mt-6 mr-2">
                    <div
                      className={`flex items-center justify-center w-10 h-10 ${
                        loading
                          ? "bg-primary text-muted"
                          : "bg-muted text-muted-foreground"
                      } rounded-full font-bold`}
                    >
                      3
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between w-full max-w-5xl gap-4 mx-auto">
                  <p className="mt-2 text-lg font-medium">Upload</p>
                  <p className="mt-2 text-lg font-medium">
                    Checking & Verification
                  </p>
                  <p className="mt-2 text-lg font-medium">Submit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <div
                    {...getRootProps()}
                    className="flex items-center justify-center w-full"
                  >
                    <input
                      {...getInputProps()}
                      id="csv-file"
                      className="hidden"
                    />
                    <label
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-900 rounded-lg cursor-pointer ${
                        isDragActive ? "bg-gray-200" : "dark:hover:bg-gray-800"
                      }`}
                    >
                      {vouchers.length > 0 ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <IconFileTypeCsv className="w-10 h-10 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{fileName}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <IconUpload className="w-10 h-10 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            CSV file up to 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              {vouchers.length > 0 && (
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-medium">Edit and Verify</p>
                      <p className="text-muted-foreground">
                        {vouchers.length} record(s) uploaded.
                      </p>
                    </div>
                    <IconEdit className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              )}
            </div>
            {vouchers.length > 0 && (
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
                <h2 className="text-2xl font-bold">Voucher Section</h2>
                {vouchers.map((vouchers, index) => (
                  <Card className="w-full">
                    <CardContent className="p-6 space-y-6">
                      {/* Voucher Code and Amount */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            Voucher Code
                          </h3>
                          <p className="text-sm font-medium">{vouchers.code}</p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-semibold text-primary">
                            Amount
                          </h3>
                          <p className="text-sm font-medium">
                            ₱{vouchers.amount}
                          </p>
                        </div>
                      </div>

                      {/* Surfing Time and Validity Period */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            Surfing Time
                          </h3>
                          <p className="text-sm font-medium">
                            {vouchers.surfing} MB
                          </p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-semibold text-primary">
                            Validity Days
                          </h3>
                          <p className="text-sm font-medium">
                            {vouchers.validityDays} day(s)
                          </p>
                        </div>
                      </div>

                      {/* Duration and Validity Text */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            Duration
                          </h3>
                          <p className="text-sm font-medium">
                            {vouchers.duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-semibold text-primary">
                            Validity Info
                          </h3>
                          <p className="text-sm font-medium">
                            {vouchers.validityText}
                          </p>
                        </div>
                      </div>

                      {/* Note Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Notes
                        </h3>
                        <p className="text-sm font-medium">{vouchers.note}</p>
                      </div>

                      {/* Creation Date */}
                      <div className="text-right">
                        <h3 className="text-lg font-semibold text-primary">
                          Created At
                        </h3>
                        <p className="text-sm font-medium">
                          {new Date(vouchers.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>

                    {/* Card Footer with Action Buttons */}
                    <CardFooter className="flex justify-end space-x-2 p-6 pt-0">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            {vouchers.length > 0 && (
              <Button
                className="w-full col-span-full"
                variant="default"
                onClick={handleCreateVouchers}
              >
                {loading ? "Uploading Voucher..." : "Upload Vouchers"}
              </Button>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="text-white">
                <IconLoader2 className="animate-spin h-full w-full ml-2" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default WifiVoucherCreation;