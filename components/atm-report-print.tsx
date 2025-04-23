import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintableContentProps {
  voucherData: any;
  currentVoucherId: number;
}

const PrintableContent: React.FC<PrintableContentProps> = ({ voucherData, currentVoucherId }) => {
  const data = voucherData[currentVoucherId];

  return (
    <div className="print-content">
      <header>
        <img src="/path/to/logo.png" alt="Company Logo" className="logo" />
        <h1>ATM Transaction Details</h1>
        <p className="date">Date: {new Date().toLocaleDateString()}</p>
      </header>

      <section className="transaction-details">
        <h2>Transaction Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Merchant ID:</span>
            <span className="value">{data.merchant_id}</span>
          </div>
          <div className="detail-item">
            <span className="label">Merchant Name:</span>
            <span className="value">{data.merchant_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Transaction Date:</span>
            <span className="value">{new Date(data.transaction_date).toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Status:</span>
            <span className="value status">{data.status || "Waiting"}</span>
          </div>
        </div>
      </section>

      <section className="transaction-counts">
        <h2>Transaction Counts</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Withdraw Count:</span>
            <span className="value">{data.withdraw_count}</span>
          </div>
          <div className="detail-item">
            <span className="label">Balance Inquiry Count:</span>
            <span className="value">{data.balance_inquiry_count}</span>
          </div>
          <div className="detail-item">
            <span className="label">Fund Transfer Count:</span>
            <span className="value">{data.fund_transfer_count}</span>
          </div>
          <div className="detail-item total">
            <span className="label">Total Transaction Count:</span>
            <span className="value">{data.total_transaction_count}</span>
          </div>
        </div>
      </section>

      <section className="transaction-amounts">
        <h2>Transaction Amounts</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Withdraw Amount:</span>
            <span className="value">₱ {Number(data.withdraw_amount || 0).toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Balance Inquiry Amount:</span>
            <span className="value">₱ {Number(data.balance_inquiry_amount || 0).toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Fund Transfer Amount:</span>
            <span className="value">₱ {Number(data.fund_transfer_amount || 0).toFixed(2)}</span>
          </div>
          <div className="detail-item total">
            <span className="label">Total Amount:</span>
            <span className="value">₱ {Number(data.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </section>

      <section className="transaction-fees">
        <h2>Transaction Fees</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Transaction Fee (RCBC):</span>
            <span className="value">₱ {Number(data.transaction_fee_rcbc || 0).toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Transaction Fee (Merchant):</span>
            <span className="value">₱ {Number(data.transaction_fee_merchant || 0).toFixed(2)}</span>
          </div>
          <div className="detail-item total">
            <span className="label">Total Fees:</span>
            <span className="value">
              ₱ {(Number(data.transaction_fee_rcbc || 0) + Number(data.transaction_fee_merchant || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function ATMDashboardPrint({ voucherData, currentVoucherId }: PrintableContentProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Print ATM Transaction</title>
            <style>
              /* Your CSS styles here */
            </style>
          </head>
          <body>
            <div id="print-content">${PrintableContent({
              voucherData,
              currentVoucherId,
            })}</div>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4">
        <Printer className="mr-2 h-4 w-4" /> Print Transaction Details
      </Button>
    </div>
  );
}
