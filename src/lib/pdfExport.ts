import jsPDF from "jspdf";

// Legacy types — kept local to avoid coupling with the modular agent types
type Signal = { category: string; value: string; evidence?: Evidence[] };
type Evidence = { claim: string; sourceUrl: string; reliability: string; type: string; snippet: string };

// Make sure the structure of report matches the expected mock structure
export async function exportAnalysisPDF(report: any) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  const marginX = 20;
  let cursorY = 20;
  const pageHeight = 297; // A4 height in mm
  const lineHeight = 7;

  // Helper to add text and manage page breaks
  const addText = (text: string, x: number, y: number, options?: any) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
      y = cursorY;
    }
    doc.text(text, x, y, options);
    return y + lineHeight;
  };

  // Helper for multiline text
  const addMultiLineText = (text: string, x: number, y: number, maxWidth: number) => {
    const splitText = doc.splitTextToSize(text, maxWidth);
    const textHeight = splitText.length * doc.getLineHeight() * 0.3527777778; // px to mm approx

    if (y + textHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
      y = cursorY;
    }

    doc.text(splitText, x, y);
    return y + (splitText.length * lineHeight);
  };

  // --- A. Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  cursorY = addText("VexIntel Enterprise Intelligence Report", marginX, cursorY);

  doc.setFontSize(16);
  doc.setTextColor(100);
  cursorY = addText(`Company: ${report.companyName || 'Unknown Domain'}`, marginX, cursorY);

  doc.setTextColor(0);
  cursorY = addText(`Lead Score: ${report.leadScore || 'N/A'} / 100`, marginX, cursorY);

  cursorY += 10; // Extra spacing

  // --- B. Signals Summary ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  cursorY = addText("Signals Summary", marginX, cursorY);
  cursorY += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const signals: Signal[] = report.signals || [];

  const fundingSignal = signals.find(s => s.category === "FUNDING");
  cursorY = addText(`Funding: ${fundingSignal ? fundingSignal.value : 'No funding activity detected'}`, marginX, cursorY);

  const hiringSignal = signals.find(s => s.category === "HIRING");
  cursorY = addText(`Hiring: ${hiringSignal ? hiringSignal.value : 'Unknown hiring velocity'}`, marginX, cursorY);

  const techSignal = signals.find(s => s.category === "TECH_STACK");
  cursorY = addText(`Tech Stack: ${techSignal ? techSignal.value : 'No technologies detected'}`, marginX, cursorY);

  cursorY += 10;

  // --- C. Evidence Table (as a structured list for clean layout) ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  cursorY = addText("Evidence Record", marginX, cursorY);
  cursorY += 5;

  doc.setFontSize(10);

  let allEvidence: Evidence[] = [];
  signals.forEach(s => {
    if (s.evidence && s.evidence.length > 0) {
      allEvidence = allEvidence.concat(s.evidence);
    }
  });

  if (allEvidence.length === 0) {
    doc.setFont("helvetica", "italic");
    cursorY = addText("No evidence collected during analysis.", marginX, cursorY);
  } else {
    allEvidence.forEach((ev, index) => {
      doc.setFont("helvetica", "bold");
      cursorY = addText(`${index + 1}. Claim: ${ev.claim}`, marginX, cursorY);

      doc.setFont("helvetica", "normal");
      cursorY = addText(`Source: ${ev.sourceUrl}`, marginX + 5, cursorY);
      cursorY = addText(`Reliability: ${ev.reliability} (${ev.type})`, marginX + 5, cursorY);

      doc.setFont("helvetica", "italic");
      doc.setTextColor(80);
      cursorY = addMultiLineText(`Snippet: "${ev.snippet}"`, marginX + 5, cursorY, 160);
      doc.setTextColor(0);

      cursorY += 5;
    });
  }

  cursorY += 5;

  // --- D. Risk Snapshot ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  cursorY = addText("Risk Snapshot", marginX, cursorY);
  cursorY += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const risks: string[] = report.risks || ["No major risks detected based on available intelligence."];
  risks.forEach(risk => {
    cursorY = addText(`• ${risk}`, marginX + 5, cursorY);
  });

  cursorY += 10;

  // --- E. Outreach Email ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  cursorY = addText("Suggested Outreach", marginX, cursorY);
  cursorY += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  const defaultEmail = `Hi Team,\n\nBased on recent ${fundingSignal ? 'funding' : 'activity'} and a ${hiringSignal ? hiringSignal.value.toLowerCase() : 'steady'} hiring velocity, we believe our platform can accelerate your technical goals.\n\nBest,\nVexIntel`;
  cursorY = addMultiLineText(report.outreachEmail || defaultEmail, marginX, cursorY, 170);

  cursorY += 10;

  // --- F. Confidence Breakdown ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  cursorY = addText("Confidence Breakdown", marginX, cursorY);
  cursorY += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  cursorY = addText(`Final Lead Score: ${report.leadScore || 'N/A'}`, marginX, cursorY);
  cursorY = addText(`Overall Confidence: ${report.confidence || '65'}%`, marginX, cursorY);

  // Save PDF
  doc.save("VexIntel_Report.pdf");
}
