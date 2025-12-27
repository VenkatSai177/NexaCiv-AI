
import { IncidentCase } from './types';

/**
 * Generates and triggers download of a CSV file containing case metadata.
 */
export const exportCasesToCSV = (cases: IncidentCase[]) => {
  const headers = [
    'Case ID',
    'Timestamp',
    'Source',
    'City',
    'Hazard Type',
    'Risk Level',
    'Severity (1-10)',
    'Confidence',
    'Status',
    'Address',
    'Latitude',
    'Longitude'
  ];

  const rows = cases.map(c => [
    c.id,
    new Date(c.timestamp).toISOString(),
    c.sourceEngine,
    c.city,
    c.analysis.hazardType,
    c.analysis.riskLevel,
    c.analysis.impactSeverity,
    c.analysis.confidenceScore,
    c.status,
    `"${c.location.address?.replace(/"/g, '""')}"`,
    c.location.latitude,
    c.location.longitude
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `DXCG_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Premium PDF Export Logic
 * Uses standard Web APIs and simple layouting for high compatibility.
 */
export const exportCaseToPDF = async (c: IncidentCase) => {
  // We use the browser's print capability with a dedicated layout for the "Premium" look
  // as jsPDF from esm.sh can be heavy and difficult to style with custom fonts/grids.
  // We trigger a specific print view by adding a print-only container.
  
  const printContainer = document.createElement('div');
  printContainer.id = 'premium-print-container';
  printContainer.className = 'fixed inset-0 bg-white text-black z-[9999] p-12 hidden print:block overflow-y-auto';
  
  const historyHtml = c.history.map(h => `
    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
      <div style="font-weight: bold; font-size: 10px;">${h.status}</div>
      <div style="font-size: 8px; color: #666;">${new Date(h.timestamp).toLocaleString()} by ${h.user}</div>
    </div>
  `).join('');

  const recommendationsHtml = c.analysis.safetyRecommendation.map(r => `<li>${r}</li>`).join('');

  printContainer.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; font-family: 'Inter', sans-serif;">
      <header style="display: flex; justify-between; align-items: center; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -1px;">DISASTERLENS X CIVICGUARD</h1>
          <p style="font-family: monospace; font-size: 10px; margin: 5px 0 0; letter-spacing: 2px;">STRATEGIC_INCIDENT_REPORT // AUTH_STATE: VERIFIED</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; font-weight: bold;">CASE_REF: ${c.id}</div>
          <div style="font-size: 10px; color: #666;">PRINTED: ${new Date().toLocaleString()}</div>
        </div>
      </header>

      <div style="display: grid; grid-template-cols: 2fr 1fr; gap: 40px;">
        <div>
          <section style="margin-bottom: 30px;">
            <h2 style="font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Tactical Analysis</h2>
            <h3 style="font-size: 32px; font-weight: 900; margin: 0; line-height: 1;">${c.analysis.hazardType}</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
              <span style="background: ${c.analysis.riskLevel === 'CRITICAL' ? '#ff003c' : '#000'}; color: #fff; padding: 4px 12px; font-size: 10px; font-weight: 900; border-radius: 4px;">${c.analysis.riskLevel}</span>
              <span style="border: 1px solid #000; padding: 4px 12px; font-size: 10px; font-weight: 900; border-radius: 4px;">IMPACT: ${c.analysis.impactSeverity}/10</span>
            </div>
          </section>

          <section style="margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h2 style="font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">AI Narrative</h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">"${c.analysis.humanReadableExplanation}"</p>
          </section>

          <section style="margin-bottom: 30px;">
            <h2 style="font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Safety Protocols</h2>
            <ul style="font-size: 12px; line-height: 1.6; padding-left: 20px;">
              ${recommendationsHtml}
            </ul>
          </section>
        </div>

        <div>
          <div style="border: 2px solid #000; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="font-size: 10px; font-weight: 900; margin-bottom: 10px;">GEOSPATIAL DATA</h2>
            <div style="font-size: 11px; margin-bottom: 5px;"><strong>City:</strong> ${c.city}</div>
            <div style="font-size: 11px; margin-bottom: 5px;"><strong>Address:</strong> ${c.location.address}</div>
            <div style="font-size: 11px; font-family: monospace; background: #eee; padding: 5px; margin-top: 10px;">
              LAT: ${c.location.latitude}<br>
              LNG: ${c.location.longitude}
            </div>
          </div>

          <div style="border: 1px solid #eee; padding: 15px; border-radius: 8px;">
            <h2 style="font-size: 10px; font-weight: 900; margin-bottom: 10px;">EVENT TIMELINE</h2>
            <div style="font-size: 11px;">
              ${historyHtml}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px;">
        <h2 style="font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Visual Evidence Captured</h2>
        <div style="width: 100%; border: 1px solid #eee; border-radius: 12px; overflow: hidden; height: 300px; background: #000; display: flex; align-items: center; justify-content: center;">
          ${c.imageUrl ? `<img src="${c.imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `<div style="color: #fff; font-family: monospace;">[ NO_VISUAL_DATA ]</div>`}
        </div>
      </div>

      <footer style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 9px; color: #999; text-align: center; font-family: monospace;">
        CONFIDENTIAL DOCUMENT // DISASTERLENS X CIVICGUARD NETWORK // DO NOT DISTRIBUTE WITHOUT CLEARANCE
      </footer>
    </div>
  `;

  document.body.appendChild(printContainer);
  window.print();
  document.body.removeChild(printContainer);
};
