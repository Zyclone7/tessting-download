import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import ReactDOM from "react-dom";

interface PrintableContentProps {
  voucherData: any;
  currentVoucherId: number;
}

const PrintableContent: React.FC<PrintableContentProps> = ({
  voucherData,
  currentVoucherId,
}) => {
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
            <span className="value">
              {new Date(data.transaction_date).toLocaleString()}
            </span>
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
            <span className="value">
              ₱ {Number(data.withdraw_amount || 0).toFixed(2)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Balance Inquiry Amount:</span>
            <span className="value">
              ₱ {Number(data.balance_inquiry_amount || 0).toFixed(2)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Fund Transfer Amount:</span>
            <span className="value">
              ₱ {Number(data.fund_transfer_amount || 0).toFixed(2)}
            </span>
          </div>
          <div className="detail-item total">
            <span className="label">Total Amount:</span>
            <span className="value">
              ₱ {Number(data.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      <section className="transaction-fees">
        <h2>Transaction Fees</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label"> Transaction Fee (RCBC):</span>
            <span className="value">
              ₱ {Number(data.transaction_fee_rcbc || 0).toFixed(2)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Transaction Fee (Merchant):</span>
            <span className="value">
              ₱ {Number(data.transaction_fee_merchant || 0).toFixed(2)}
            </span>
          </div>
          <div className="detail-item total">
            <span className="label">Total Fees:</span>
            <span className="value">
              ₱{" "}
              {(
                Number(data.transaction_fee_rcbc || 0) +
                Number(data.transaction_fee_merchant || 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function ATMDashboardPrint({
  voucherData,
  currentVoucherId,
}: PrintableContentProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
            <html>
              <head>
                <title>ATM Transaction Details</title>
                <style>
                  @media print {
                    @page { margin: 0; }
                    body { margin: 1.6cm; }
                  }
                  body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                  }
                  .print-content {
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 8px;
                  }
                  header {
                    text-align: center;
                    margin-bottom: 20px;
                  }
                  .logo {
                    max-width: 100px;
                    margin-bottom: 10px;
                  }
                  h1 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 24px;
                  }
                  .date {
                    font-style: italic;
                    color: #7f8c8d;
                  }
                  section {
                    margin-bottom: 30px;
                  }
                  h2 {
                    color: #2980b9;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                    font-size: 20px;
                  }
                  .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                  }
                  .detail-item {
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 5px;
                    padding: 10px;
                    transition: background-color 0.3s;
                  }
                  .detail-item:hover {
                    background-color: #eaf2f8;
                  }
                  .label {
                    font-weight: bold;
                    color: #34495e;
                    display: block;
                    margin-bottom: 5px;
                  }
                  .value {
                    color: #2c3e50;
                  }
                  .total {
                    background-color: #eaf2f8;
                    border-color: #3498db;
                  }
                  .status {
                    font-weight: bold;
                    color: #27ae60;
                  }
                </style>
              </head>
              <body>
                <div id="print-content"></div>
              </body>
            </html>
          `);
      printWindow.document.close();

      const printContentContainer =
        printWindow.document.getElementById("print-content");
      if (printContentContainer) {
        const root = (printWindow as any).ReactDOM.createRoot(
          printContentContainer
        );
        const contentToPrint = (
          <PrintableContent
            voucherData={voucherData}
            currentVoucherId={currentVoucherId}
          />
        );
        root.render(contentToPrint);
        printWindow.print();
      }
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
