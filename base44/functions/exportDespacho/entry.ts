import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { despacho_id, producciones } = await req.json();
    const despacho = producciones.find(p => p.id === despacho_id);
    
    if (!despacho) {
      return Response.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Título
    doc.setFontSize(18);
    doc.setTextColor(92, 16, 32);
    doc.text('Detalles del Despacho', margin, 20);

    // Info general
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let y = 35;

    const fields = [
      ['Nro. Carga', despacho.nro_carga],
      ['Fecha', despacho.fecha],
      ['Estado', despacho.estado],
      ['Cliente', despacho.cliente || '—'],
      ['Destino', despacho.destino || '—'],
      ['Contenedor', despacho.contenedor || '—'],
      ['Nro. Remito', despacho.nro_remito || '—'],
      ['Termógrafo', despacho.termografo || '—'],
      ['Capacidad Pallets', String(despacho.cant_pallets_max)]
    ];

    fields.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', margin, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), margin + 50, y);
      y += 7;
    });

    // Tabla de pallets
    y += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(92, 16, 32);
    doc.text('Pallets Asignados', margin, y);
    y += 8;

    // Encabezados de tabla
    const pallets = (despacho.pallet_ids || []).map(id => producciones.find(p => p.id === id)).filter(Boolean);
    
    if (pallets.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No hay pallets asignados', margin, y);
    } else {
      const colWidths = [25, 25, 20, 25, 20, 25, 20];
      const headers = ['Romaneo', 'Productor', 'Variedad', 'Calibre', 'Bultos', 'Kg Netos', ''];

      // Encabezados
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(92, 16, 32);
      let x = margin;
      headers.forEach((header, i) => {
        doc.rect(x, y - 5, colWidths[i], 6, 'F');
        doc.text(header, x + 2, y - 1);
        x += colWidths[i];
      });

      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      y += 7;

      // Filas de datos
      pallets.forEach((p, idx) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        
        const rowData = [
          p.nro_romaneo || '—',
          p.productor || '—',
          p.variedad || '—',
          p.calibre || '—',
          String(p.cant_bultos || 0),
          String(p.kg_netos || 0),
          ''
        ];

        x = margin;
        rowData.forEach((cell, i) => {
          doc.text(cell, x + 2, y);
          x += colWidths[i];
        });

        if (idx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 5, 'F');
        }
        y += 5;
      });

      // Totales
      const totalBultos = pallets.reduce((s, p) => s + (p.cant_bultos || 0), 0);
      const totalKg = pallets.reduce((s, p) => s + (p.kg_netos || 0), 0);
      
      y += 3;
      doc.setFont(undefined, 'bold');
      doc.setTextColor(92, 16, 32);
      doc.text(`Total: ${totalBultos} bultos | ${totalKg} kg netos`, margin + 60, y);
    }

    const pdfBytes = doc.output('arraybuffer');
    const fileName = `Despacho_${despacho.nro_carga}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${fileName}`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});