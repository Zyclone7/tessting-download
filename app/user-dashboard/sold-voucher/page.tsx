import { Separator } from "@/components/ui/separator";
import SoldVoucherTable from "@/components/table/sold-voucher-table";

const SoldVoucher = () => {
  return (
    <div className="w-full px-6">
      <p className="text-3xl font-bold">Sold Products</p>
      <p className="text-muted-foreground mt-2">
        Configure and manage Subscription Package details and communication settings. settings.
      </p>
      <Separator className="my-6" />
      <SoldVoucherTable />
    </div>
  );
};

export default SoldVoucher;
