import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';
import { Product, TransactionWithProduct } from '@shared/schema';

interface ReportSummary {
  totalAmount: number;
  totalQuantity: number;
  orderCount: number;
  avgOrderValue: number;
  productSummary: Array<{
    name: string;
    quantity: number;
    revenue: number;
    percentOfTotal: number;
  }>;
}

/**
 * Generate and download a PDF report
 * @param reportTitle Title of the report
 * @param reportType Type of report (sales, purchases, inventory, profit)
 * @param startDate Start date of report period
 * @param endDate End date of report period
 * @param summary Summary data for the report
 * @param transactions Transactions data
 */
export function generatePDF(
  reportTitle: string,
  reportType: string,
  startDate: string,
  endDate: string,
  summary: ReportSummary,
  transactions: TransactionWithProduct[]
) {
  // Initialize PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80);
  doc.text(reportTitle, 105, 15, { align: 'center' });
  
  // Add farm name and date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Nature Breed Farm', 105, 22, { align: 'center' });
  doc.text(`Report generated on ${new Date().toLocaleDateString()}`, 105, 27, { align: 'center' });
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, 40);
  
  // Summary data
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  const summaryLabels = {
    sales: 'Total Sales',
    purchases: 'Total Purchases',
    inventory: 'Inventory Value',
    profit: 'Net Profit',
  };
  
  const metricLabel = summaryLabels[reportType as keyof typeof summaryLabels] || 'Total';
  
  // Display summary boxes
  const summaryData = [
    { label: metricLabel, value: formatCurrency(summary.totalAmount) },
    { label: 'Total Quantity', value: `${summary.totalQuantity.toFixed(2)} units` },
    { label: reportType === 'inventory' ? 'Stock Items' : 'Avg. Transaction Value', 
      value: reportType === 'inventory' ? summary.orderCount.toString() : formatCurrency(summary.avgOrderValue) },
    { label: 'Number of Transactions', value: summary.orderCount.toString() },
  ];
  
  // Create summary boxes
  summaryData.forEach((item, index) => {
    const x = 14 + (index % 2) * 95;
    const y = 45 + Math.floor(index / 2) * 15;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, x, y);
    
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text(item.value, x, y + 6);
  });
  
  // Add detailed table
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Detail by Product', 14, 85);
  
  // Create table headers based on report type
  let headers: string[];
  if (reportType === 'sales') {
    headers = ['Product', 'Quantity', 'Revenue', '% of Total'];
  } else if (reportType === 'purchases') {
    headers = ['Product', 'Quantity', 'Cost', '% of Total'];
  } else if (reportType === 'inventory') {
    headers = ['Product', 'Quantity', 'Value', '% of Total'];
  } else {
    headers = ['Product', 'Quantity', 'Profit/Loss', '% of Total'];
  }
  
  // Prepare table data
  const tableData = summary.productSummary.map(product => [
    product.name,
    product.quantity.toFixed(2),
    formatCurrency(product.revenue),
    `${product.percentOfTotal.toFixed(1)}%`
  ]);
  
  // Draw the table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 90,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Add footer with page numbers
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} - Nature Breed Farm Management System`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
}