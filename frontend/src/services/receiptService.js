import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (sale, cartItems) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text('InnovaLogix Retail', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('RUC: 20123456789', pageWidth / 2, 30, { align: 'center' });
    doc.text('Av. Principal 123, Lima', pageWidth / 2, 36, { align: 'center' });

    // Receipt Info
    doc.setFontSize(14);
    doc.text(`${sale.receiptType.toUpperCase()}: ${sale.receiptNumber}`, 14, 50);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(sale.date).toLocaleString()}`, 14, 58);
    doc.text(`Método de Pago: ${sale.paymentMethod.toUpperCase()}`, 14, 64);

    // Client Data
    if (sale.clientData) {
        doc.text(`Cliente: ${sale.clientData.name || 'Sin Nombre'}`, 14, 72);
        doc.text(`Doc: ${sale.clientData.docNumber || '-'}`, 14, 78);
        if (sale.clientData.address) {
            doc.text(`Dirección: ${sale.clientData.address}`, 14, 84);
        }
    } else {
        doc.text('Cliente: PÚBLICO GENERAL', 14, 72);
    }

    // Items Table
    const tableColumn = ["Producto", "Cant.", "Precio Unit.", "Total"];
    const tableRows = [];

    cartItems.forEach(item => {
        const itemData = [
            item.name,
            item.quantity,
            `S/ ${item.price.toFixed(2)}`,
            `S/ ${(item.price * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: S/ ${(sale.total / 1.18).toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
    doc.text(`IGV (18%): S/ ${(sale.total - (sale.total / 1.18)).toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: S/ ${sale.total.toFixed(2)}`, pageWidth - 14, finalY + 14, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, finalY + 30, { align: 'center' });

    // Save
    doc.save(`Comprobante-${sale.receiptNumber}.pdf`);
};
