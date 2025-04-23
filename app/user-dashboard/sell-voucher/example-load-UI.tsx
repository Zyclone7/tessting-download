import React, { useState } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Phone,
  Info,
  Settings,
  Globe,
  Zap,
  Wifi,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define TypeScript interfaces
interface TelcoProvider {
  id: string;
  name: string;
  logo: string;
  useIcon?: boolean;
}

interface Promo {
  id: string;
  name: string;
  description: string;
  price: number;
  validity: string;
  type: string;
  icon: React.ReactNode;
}

const TelcoInterface: React.FC = () => {
  const [selectedTelco, setSelectedTelco] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [openLoadDialog, setOpenLoadDialog] = useState<boolean>(false);
  const [showPromoDialog, setShowPromoDialog] = useState<boolean>(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<boolean>(false);
  const [currentTelco, setCurrentTelco] = useState<TelcoProvider | null>(null);

  // Telco providers data
  const telcoProviders: TelcoProvider[] = [
    { id: "globe", name: "Globe", logo: "/images/load/globe.png" },
    { id: "tm", name: "TM", logo: "/images/load/tm.png" },
    { id: "gomo", name: "GOMO", logo: "/images/load/gomo.png" },
    { id: "smart", name: "Smart", logo: "/images/load/smart.png" },
    { id: "tnt", name: "TNT", logo: "/images/load/TNT.png" },
    { id: "dito", name: "DITO", logo: "/images/load/dito.png" },
    { id: "esim", name: "eSIM", logo: "", useIcon: true },
    { id: "roaming", name: "Roaming", logo: "", useIcon: true },
  ];

  // Preset load amounts
  const loadAmounts: number[] = [50, 100, 200, 300, 500, 1000];

  // Promo data based on telco selected
  const getPromos = (telcoId: string): Promo[] => {
    switch (telcoId) {
      case "globe":
        return [
          {
            id: "gosurf99",
            name: "GoSURF99",
            description: "8GB data, unli all-net texts, valid for 7 days",
            price: 99,
            validity: "7 days",
            type: "data",
            icon: <Wifi className="h-5 w-5 text-blue-500" />,
          },
          {
            id: "goplus129",
            name: "Go+ 129",
            description:
              "10GB data, unli all-net calls & texts, valid for 7 days",
            price: 129,
            validity: "7 days",
            type: "combo",
            icon: <Zap className="h-5 w-5 text-green-500" />,
          },
          {
            id: "go50",
            name: "Go 50",
            description: "Unlimited calls to Globe/TM for 3 days",
            price: 50,
            validity: "3 days",
            type: "call",
            icon: <Phone className="h-5 w-5 text-purple-500" />,
          },
          {
            id: "goplus599",
            name: "Go+ 599",
            description:
              "30GB data, unli all-net calls & texts, valid for 30 days",
            price: 599,
            validity: "30 days",
            type: "combo",
            icon: <Calendar className="h-5 w-5 text-orange-500" />,
          },
        ];
      case "smart":
        return [
          {
            id: "giga99",
            name: "GIGA 99",
            description: "8GB data, unli all-net texts, valid for 7 days",
            price: 99,
            validity: "7 days",
            type: "data",
            icon: <Wifi className="h-5 w-5 text-blue-500" />,
          },
          {
            id: "giga149",
            name: "GIGA+ 149",
            description:
              "12GB data, unli all-net calls & texts, valid for 7 days",
            price: 149,
            validity: "7 days",
            type: "combo",
            icon: <Zap className="h-5 w-5 text-green-500" />,
          },
        ];
      default:
        return [
          {
            id: "data99",
            name: "Data 99",
            description: "8GB data, valid for 7 days",
            price: 99,
            validity: "7 days",
            type: "data",
            icon: <Wifi className="h-5 w-5 text-blue-500" />,
          },
          {
            id: "combo149",
            name: "Combo 149",
            description: "10GB data, unli calls & texts, valid for 7 days",
            price: 149,
            validity: "7 days",
            type: "combo",
            icon: <Zap className="h-5 w-5 text-green-500" />,
          },
        ];
    }
  };

  const handleProceed = (): void => {
    if (phoneNumber) {
      setOpenLoadDialog(false);
      setShowPromoDialog(true);
    }
  };

  const handlePromoSelect = (promo: Promo): void => {
    setSelectedPromo(promo);
    setShowPromoDialog(false);
    setConfirmationDialog(true);
  };

  const formatPhoneNumber = (number: string): string => {
    // Remove non-digit characters
    const cleaned = number.replace(/\D/g, "");

    // Format as XXX XXX XXXX
    if (cleaned.length >= 10) {
      return (
        cleaned.slice(0, 3) +
        " " +
        cleaned.slice(3, 6) +
        " " +
        cleaned.slice(6, 10)
      );
    }
    return cleaned;
  };

  const handleRegularLoadSelect = (amt: number): void => {
    setAmount(amt.toString());
    setShowPromoDialog(false);
    setSelectedPromo({
      id: "regular",
      name: "Regular Load",
      description: `₱${amt} regular load credit`,
      price: amt,
      validity: "No expiry",
      type: "regular",
      icon: <Phone className="h-5 w-5 text-gray-500" />,
    });
    setConfirmationDialog(true);
  };

  const handleCustomAmountSubmit = (): void => {
    if (amount && parseFloat(amount) >= 10) {
      setShowPromoDialog(false);
      setSelectedPromo({
        id: "custom",
        name: "Custom Load",
        description: `₱${amount} regular load credit`,
        price: parseFloat(amount),
        validity: "No expiry",
        type: "regular",
        icon: <Phone className="h-5 w-5 text-gray-500" />,
      });
      setConfirmationDialog(true);
    }
  };

  const handlePurchaseConfirmation = (): void => {
    // This would handle the payment processing in a real app
    setConfirmationDialog(false);
    // Show success message or redirect
    alert("Your load purchase was successful!");
  };

  const handleTelcoSelect = (provider: TelcoProvider): void => {
    setSelectedTelco(provider.id);
    setCurrentTelco(provider);
    setOpenLoadDialog(true);
  };

  return (
    <div>
      <Alert className="mb-6 border-orange-500 bg-orange-50">
        <Info className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-800">Development Notice</AlertTitle>
        <AlertDescription className="text-orange-700">
          The Telco E-load feature is currently under development. This
          interface is a preview of upcoming functionality.
        </AlertDescription>
      </Alert>

      <CardHeader>
        <h2 className="text-xl font-semibold">Select Telco Provider</h2>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {telcoProviders.map((provider) => (
            <div
              key={provider.id}
              className={`flex items-center p-6 rounded-lg cursor-pointer transition-all border ${
                selectedTelco === provider.id
                  ? "border-2 border-blue-500"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => handleTelcoSelect(provider)}
            >
              <div className="h-12 w-12 flex items-center justify-center mr-6">
                {provider.useIcon ? (
                  provider.id === "esim" ? (
                    <Settings className="w-10 h-10 text-blue-500" />
                  ) : (
                    <Globe className="w-10 h-10 text-blue-500" />
                  )
                ) : (
                  <img
                    src={provider.logo}
                    alt={`${provider.name} logo`}
                    className="h-full object-contain"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = "none";
                      const element = e.currentTarget.parentElement;
                      if (element) {
                        const div = document.createElement("div");
                        div.className = "flex items-center justify-center";
                        div.innerHTML =
                          '<Phone class="w-10 h-10 text-blue-500" />';
                        element.appendChild(div);
                      }
                    }}
                  />
                )}
              </div>
              <span className="text-lg font-medium">{provider.name}</span>
            </div>
          ))}
        </div>

        {/* Phone Number Entry Dialog */}
        <Dialog open={openLoadDialog} onOpenChange={setOpenLoadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Phone Number</DialogTitle>
              <DialogDescription>
                Enter the phone number to load for {currentTelco?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <div className="bg-gray-100 px-3 flex items-center rounded-l-md border border-r-0 border-gray-300">
                    +63
                  </div>
                  <Input
                    id="phone"
                    className="rounded-l-none"
                    placeholder="9XX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Only allow digits and handle auto-correction
                      let value = e.target.value.replace(/\D/g, "");

                      // Auto-correct if user inputs "09" prefix
                      if (value.startsWith("09")) {
                        value = value.substring(1); // Remove the leading 0
                      }

                      if (value.length <= 10) {
                        setPhoneNumber(value);
                      }
                    }}
                  />
                </div>
                {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                  <p className="text-xs text-orange-500 mt-1">
                    Please enter a 10-digit number (9XX XXX XXXX)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenLoadDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={phoneNumber.length !== 10}
                onClick={handleProceed}
              >
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Promo Selection Dialog */}
        <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Load Type</DialogTitle>
              <DialogDescription>
                Loading for: +63 {formatPhoneNumber(phoneNumber)} (
                {currentTelco?.name})
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="promos" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="promos">Promos</TabsTrigger>
                <TabsTrigger value="regular">Regular Load</TabsTrigger>
              </TabsList>

              <TabsContent value="promos" className="space-y-4">
                <div className="grid gap-3">
                  {currentTelco &&
                    getPromos(currentTelco.id).map((promo) => (
                      <div
                        key={promo.id}
                        className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-all"
                        onClick={() => handlePromoSelect(promo)}
                      >
                        <div className="flex items-center">
                          <div className="bg-blue-50 p-2 rounded-full mr-3">
                            {promo.icon}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{promo.name}</h3>
                              <span className="ml-2 text-green-600 font-semibold">
                                ₱{promo.price}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {promo.description}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              Valid for {promo.validity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="regular" className="space-y-4">
                <Label>Select Amount</Label>
                <div className="grid grid-cols-3 gap-3">
                  {loadAmounts.map((amt) => (
                    <div
                      key={amt}
                      className="py-2 px-4 border rounded-md text-center cursor-pointer transition-all hover:border-blue-300"
                      onClick={() => handleRegularLoadSelect(amt)}
                    >
                      ₱{amt}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="custom-amount">Or enter custom amount</Label>
                  <Input
                    id="custom-amount"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAmount(e.target.value)
                    }
                    type="number"
                  />
                  <Button
                    className="w-full mt-2"
                    disabled={!amount || parseFloat(amount) < 10}
                    onClick={handleCustomAmountSubmit}
                  >
                    Proceed with ₱{amount}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPromoDialog(false);
                  setOpenLoadDialog(true);
                }}
              >
                Back
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmationDialog} onOpenChange={setConfirmationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                Please review your selection before proceeding
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Telco Provider:</div>
                  <div className="font-medium">{currentTelco?.name}</div>

                  <div className="text-gray-600">Phone Number:</div>
                  <div className="font-medium">
                    +63 {formatPhoneNumber(phoneNumber)}
                  </div>

                  <div className="text-gray-600">Load Type:</div>
                  <div className="font-medium">{selectedPromo?.name}</div>

                  <div className="text-gray-600">Description:</div>
                  <div className="font-medium">
                    {selectedPromo?.description}
                  </div>

                  <div className="text-gray-600">Validity:</div>
                  <div className="font-medium">{selectedPromo?.validity}</div>

                  <div className="text-gray-600">Amount:</div>
                  <div className="font-medium text-green-600">
                    ₱{selectedPromo?.price.toFixed(2)}
                  </div>
                </div>
              </div>

              <Alert className="border-blue-500 bg-blue-50">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-800">
                  Payment Notice
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  This amount will be charged to your connected payment method.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirmationDialog(false);
                  setShowPromoDialog(true);
                }}
              >
                Back
              </Button>
              <Button type="submit" onClick={handlePurchaseConfirmation}>
                Confirm Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </div>
  );
};

export default TelcoInterface;
