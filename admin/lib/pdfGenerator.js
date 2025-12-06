import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF report for city-level waste management data
 */
export function generateCityReportPDF({
  cityStats,
  monthlyData,
  totals,
  timeRange,
  selectedCity,
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  let finalY = yPosition;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const successColor = [46, 204, 113]; // Green
  const textColor = [52, 73, 94]; // Dark gray

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('City-Level Waste Management Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, 30, { align: 'center' });

  yPosition = 50;

  // Report Parameters
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Parameters', 14, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const timeRangeLabels = {
    '1m': 'Last Month',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '1y': 'Last Year',
  };
  doc.text(`Time Range: ${timeRangeLabels[timeRange] || timeRange}`, 14, yPosition);
  yPosition += 6;
  doc.text(`City Filter: ${selectedCity === 'all' ? 'All Cities' : selectedCity}`, 14, yPosition);
  yPosition += 15;

  // Summary Statistics
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Summary Statistics', 14, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  const stats = [
    ['Total Waste Collected', `${(totals.totalWaste / 1000).toFixed(2)} tons (${totals.totalWaste.toLocaleString()} kg)`],
    ['Total Recycled', `${(totals.totalRecycled / 1000).toFixed(2)} tons (${totals.totalRecycled.toLocaleString()} kg)`],
    ['Recycling Rate', totals.totalWaste > 0 
      ? `${((totals.totalRecycled / totals.totalWaste) * 100).toFixed(1)}%`
      : '0%'],
    ['Active Users', totals.totalUsers.toLocaleString()],
    ['Tokens Distributed', totals.totalTokens.toLocaleString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { cellWidth: 70 },
    },
    didDrawPage: (data) => {
      finalY = data.cursor.y;
    },
  });

  yPosition = finalY + 15;

  // Monthly Trend Table
  if (monthlyData.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('Monthly Trend Analysis', 14, yPosition);
    
    yPosition += 10;
    
    const monthlyTableData = monthlyData.map(month => [
      month.month,
      `${month.waste.toLocaleString()} kg`,
      `${month.recycled.toLocaleString()} kg`,
      month.waste > 0 
        ? `${((month.recycled / month.waste) * 100).toFixed(1)}%`
        : '0%',
      month.tokens.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Month', 'Total Waste', 'Recycled', 'Rate', 'Tokens']],
      body: monthlyTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' },
      },
      didDrawPage: (data) => {
        finalY = data.cursor.y;
      },
    });

    yPosition = finalY + 15;
  }

  // City-wise Breakdown Table
  if (cityStats.length > 0) {
    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('City-wise Performance Breakdown', 14, yPosition);
    
    yPosition += 10;
    
    const cityTableData = cityStats.map(city => [
      city.city,
      `${city.totalWaste.toLocaleString()} kg`,
      `${city.recycled.toLocaleString()} kg`,
      city.totalWaste > 0 
        ? `${((city.recycled / city.totalWaste) * 100).toFixed(1)}%`
        : '0%',
      city.users.toLocaleString(),
      city.tokens.toLocaleString(),
      city.trend === 'up' ? `+${city.change}%` : `-${city.change}%`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['City', 'Total Waste', 'Recycled', 'Rate', 'Users', 'Tokens', 'Trend']],
      body: cityTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
      },
      didParseCell: (data) => {
        // Color code trend column
        if (data.column.index === 6) {
          const trendValue = data.cell.text[0];
          if (trendValue.startsWith('+')) {
            data.cell.styles.textColor = successColor;
          } else if (trendValue.startsWith('-')) {
            data.cell.styles.textColor = [231, 76, 60]; // Red
          }
        }
      },
      didDrawPage: (data) => {
        finalY = data.cursor.y;
      },
    });

    yPosition = finalY + 15;
  }

  // Footer on each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | EcoFlow Waste Management System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const citySuffix = selectedCity === 'all' ? 'All-Cities' : selectedCity;
  const filename = `City-Report-${citySuffix}-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;

  // Save the PDF
  doc.save(filename);
}

