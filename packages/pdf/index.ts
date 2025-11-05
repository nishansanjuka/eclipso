import PDFDocument from "pdfkit";
import path from "path";

interface Tax {
  rate: number;
}

interface Discount {
  value: number;
}

interface Product {
  name: string;
}

interface OrderItem {
  qty: number;
  price: number;
  taxes: Tax[];
  discounts: Discount[];
  product: Product;
}

interface Order {
  id: string;
  status: string;
  expectedDate: string;
}

interface Invoice {
  invoiceNumber: string;
  createdAt: string;
  statusColor?: string;
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
}

interface InvoiceData {
  invoice: Invoice;
  order: Order;
  orderItems: OrderItem[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`;
}

async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      // Register custom fonts (Inter)
      doc.registerFont(
        "Inter-Regular",
        path.join(__dirname, "fonts/Inter-Regular.ttf")
      );
      doc.registerFont(
        "Inter-Bold",
        path.join(__dirname, "fonts/Inter-Bold.ttf")
      );
      doc.registerFont(
        "Inter-Italic",
        path.join(__dirname, "fonts/Inter-Italic.ttf")
      );

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const { invoice, order, orderItems } = invoiceData;

      // Brand color
      const brandColor = "#6366F1";

      // ------------------------------------------
      // HEADER SECTION
      // ------------------------------------------
      doc
        .fillColor(brandColor)
        .font("Inter-Bold")
        .fontSize(28)
        .text("Eclipso", 50, 50);

      doc
        .fillColor("black")
        .font("Inter-Regular")
        .fontSize(10)
        .text("Your Trusted Partner", 50, 85, { width: 200 });

      const rightX = 400;
      doc.font("Inter-Bold").fontSize(10).text("Invoice Number:", rightX, 50);

      doc.font("Inter-Regular").text(invoice.invoiceNumber, rightX, 65, {
        width: 145,
        align: "left",
      });

      doc
        .font("Inter-Bold")
        .text("Invoice Date:", rightX, 95)
        .font("Inter-Regular")
        .text(formatDate(invoice.createdAt), rightX, 110);

      doc
        .font("Inter-Bold")
        .text("Status:", rightX, 130)
        .font("Inter-Regular")
        .fillColor(invoice.statusColor || brandColor)
        .text(order.status.toUpperCase(), rightX, 145)
        .fillColor("black");

      doc.moveTo(50, 170).lineTo(545, 170).stroke();

      // ------------------------------------------
      // ORDER INFORMATION
      // ------------------------------------------
      let yPos = 190;
      doc
        .fillColor(brandColor)
        .fontSize(12)
        .font("Inter-Bold")
        .text("Order Details", 50, yPos);

      doc.fillColor("black");

      yPos += 20;
      doc
        .fontSize(9)
        .font("Inter-Regular")
        .text(`Order ID: ${order.id}`, 50, yPos)
        .text(`Expected Date: ${formatDate(order.expectedDate)}`, 300, yPos);

      // ------------------------------------------
      // TABLE HEADER
      // ------------------------------------------
      yPos += 40;
      const tableTop = yPos;
      const col1 = 50,
        col2 = 200,
        col3 = 300,
        col4 = 370,
        col5 = 440,
        col6 = 500;

      // Shaded header background
      doc
        .rect(50, tableTop - 5, 495, 20)
        .fill("#F3F4F6")
        .stroke();
      doc.fillColor("black").font("Inter-Bold").fontSize(10);
      doc
        .text("Item", col1, tableTop)
        .text("Qty", col2, tableTop)
        .text("Price", col3, tableTop)
        .text("Tax", col4, tableTop)
        .text("Discount", col5, tableTop)
        .text("Total", col6, tableTop);

      // ------------------------------------------
      // TABLE ITEMS
      // ------------------------------------------
      yPos += 25;
      doc.font("Inter-Regular").fontSize(9);

      orderItems.forEach((item) => {
        const lineHeight = 35;

        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const taxRate = item.taxes[0]?.rate || 0;
        const discountValue = item.discounts[0]?.value || 0;
        const itemSubtotal = item.qty * item.price;
        const itemTax = (itemSubtotal * taxRate) / 100;
        const itemDiscount = (itemSubtotal * discountValue) / 100;
        const itemTotal = itemSubtotal + itemTax - itemDiscount;

        doc.text(item.product.name, col1, yPos, { width: 140 });
        doc.text(item.qty.toString(), col2, yPos);
        doc.text(formatCurrency(item.price), col3, yPos);
        doc.text(`${taxRate}%`, col4, yPos);
        doc.text(`${discountValue}%`, col5, yPos);
        doc.text(formatCurrency(itemTotal), col6, yPos);

        yPos += lineHeight;
      });

      // ------------------------------------------
      // SUMMARY SECTION
      // ------------------------------------------
      yPos += 10;
      doc.moveTo(50, yPos).lineTo(545, yPos).stroke();
      yPos += 20;

      const summaryX = 400;
      doc.fontSize(10).font("Inter-Regular");

      doc
        .text("Subtotal:", summaryX, yPos)
        .text(formatCurrency(invoice.subTotal), summaryX + 100, yPos, {
          align: "right",
        });
      yPos += 20;

      doc
        .text("Total Tax:", summaryX, yPos)
        .text(formatCurrency(invoice.totalTax), summaryX + 100, yPos, {
          align: "right",
        });
      yPos += 20;

      doc
        .text("Total Discount:", summaryX, yPos)
        .text(formatCurrency(invoice.totalDiscount), summaryX + 100, yPos, {
          align: "right",
        });
      yPos += 20;

      doc.moveTo(summaryX, yPos).lineTo(545, yPos).stroke();
      yPos += 10;

      doc
        .fillColor(brandColor)
        .fontSize(12)
        .font("Inter-Bold")
        .text("Grand Total:", summaryX, yPos)
        .text(formatCurrency(invoice.grandTotal), summaryX + 100, yPos, {
          align: "right",
        })
        .fillColor("black");

      // ------------------------------------------
      // FOOTER
      // ------------------------------------------
      doc
        .fontSize(8)
        .font("Inter-Italic")
        .fillColor("#6B7280")
        .text("Thank you for your business!", 50, 750, {
          align: "center",
          width: 495,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export { generateInvoicePDF };