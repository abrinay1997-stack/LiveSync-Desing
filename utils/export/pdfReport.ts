/**
 * PDF Report Generator
 *
 * Generates professional PDF reports with equipment lists,
 * coverage maps, and rigging analysis
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SceneObject, Cable, Layer } from '../../types';
import { ASSETS } from '../../data/library';
import { generateEquipmentList, generateCableSchedule, calculateEquipmentTotals } from './csvExport';

interface ReportOptions {
    projectName?: string;
    engineer?: string;
    venue?: string;
    date?: string;
    includeEquipment?: boolean;
    includeCoverage?: boolean;
    includeRigging?: boolean;
    includeCables?: boolean;
    coverageImageData?: string; // Base64 PNG
}

/**
 * Generate a complete PDF report
 */
export async function generatePDFReport(
    objects: SceneObject[],
    cables: Cable[],
    layers: Layer[],
    options: ReportOptions = {}
): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // Colors
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const textColor: [number, number, number] = [31, 41, 55];
    const lightGray: [number, number, number] = [156, 163, 175];

    // ============ COVER PAGE ============
    // Header bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LiveSync Design', margin, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Audio System Report', margin, 33);

    // Project info
    y = 60;
    doc.setTextColor(...textColor);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(options.projectName || 'Untitled Project', margin, y);

    y += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);

    if (options.venue) {
        doc.text(`Venue: ${options.venue}`, margin, y);
        y += 7;
    }
    if (options.engineer) {
        doc.text(`Engineer: ${options.engineer}`, margin, y);
        y += 7;
    }
    doc.text(`Date: ${options.date || new Date().toLocaleDateString()}`, margin, y);
    y += 7;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

    // Summary box
    y += 20;
    const totals = calculateEquipmentTotals(objects);

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Summary', margin + 5, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const summaryY = y + 16;
    doc.text(`Total Items: ${totals.totalItems}`, margin + 5, summaryY);
    doc.text(`Total Weight: ${totals.totalWeight.toFixed(1)} kg`, margin + 60, summaryY);
    doc.text(`Cables: ${cables.length}`, margin + 120, summaryY);

    // Type breakdown
    const typeBreakdown = Object.entries(totals.byType)
        .map(([type, data]) => `${type}: ${data.count}`)
        .join('  |  ');
    doc.text(typeBreakdown, margin + 5, summaryY + 8);

    // ============ EQUIPMENT LIST ============
    if (options.includeEquipment !== false && objects.length > 0) {
        doc.addPage();
        y = margin;

        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Equipment List', margin, y);

        y += 10;

        const equipmentRows = generateEquipmentList(objects, layers);
        const tableData = equipmentRows.map(row => [
            row.name,
            row.type,
            row.quantity.toString(),
            `${row.weight} kg`,
            `${row.totalWeight} kg`,
            row.layer
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Item', 'Type', 'Qty', 'Unit Wt.', 'Total Wt.', 'Layer']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: textColor
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 25 },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 35 }
            },
            margin: { left: margin, right: margin }
        });

        // Total weight footer
        const finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text(`Total System Weight: ${totals.totalWeight.toFixed(1)} kg`, pageWidth - margin - 50, finalY);
    }

    // ============ CABLE SCHEDULE ============
    if (options.includeCables !== false && cables.length > 0) {
        doc.addPage();
        y = margin;

        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Cable Schedule', margin, y);

        y += 10;

        const cableRows = generateCableSchedule(cables, objects);
        const cableData = cableRows.map(row => [
            row.id,
            row.type,
            row.from,
            row.to,
            row.length
        ]);

        autoTable(doc, {
            startY: y,
            head: [['ID', 'Type', 'From', 'To', 'Length']],
            body: cableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: textColor
            },
            margin: { left: margin, right: margin }
        });
    }

    // ============ COVERAGE MAP ============
    if (options.includeCoverage !== false && options.coverageImageData) {
        doc.addPage();
        y = margin;

        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SPL Coverage Map', margin, y);

        y += 10;

        // Add the coverage image
        try {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = imgWidth * 0.6; // Approximate aspect ratio

            doc.addImage(
                options.coverageImageData,
                'PNG',
                margin,
                y,
                imgWidth,
                imgHeight
            );

            y += imgHeight + 10;

            // Legend
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightGray);
            doc.text('Legend: Red = Poor (<85dB) | Amber = Acceptable (85-90dB) | Green = Good (90-100dB) | Emerald = Excellent (100-105dB)', margin, y);
        } catch (err) {
            console.error('Failed to add coverage image:', err);
            doc.setTextColor(...lightGray);
            doc.text('Coverage map not available', margin, y);
        }
    }

    // ============ FOOTER ON ALL PAGES ============
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            'Generated by LiveSync Design',
            margin,
            pageHeight - 10
        );
    }

    return doc.output('blob');
}

/**
 * Download PDF report
 */
export async function downloadPDFReport(
    objects: SceneObject[],
    cables: Cable[],
    layers: Layer[],
    options: ReportOptions = {}
): Promise<void> {
    const blob = await generatePDFReport(objects, cables, layers, options);
    const url = URL.createObjectURL(blob);

    const filename = `${(options.projectName || 'livesync-report').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
