import React, { useState } from 'react';
import type { FormData, ScheduleEntry } from '../types';
import { DownloadIcon, PlusIcon, TrashIcon } from './icons';

const SCHOOL_WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const TransportationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    schedule: [{
      id: crypto.randomUUID(),
      day: 'Montag',
      departureStop: '',
      departureStopLocation: '',
      arrivalSchool: '',
      arrivalSchoolLocation: '',
      departureSchool: '',
      departureSchoolLocation: '',
      arrivalStop: '',
      arrivalStopLocation: ''
    }],
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [name]: value };
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const handleAddEntry = () => {
    const availableDays = SCHOOL_WEEKDAYS.filter(d => !formData.schedule.some(s => s.day === d));
    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          id: crypto.randomUUID(),
          day: availableDays[0] || 'Montag',
          departureStop: '',
          departureStopLocation: '',
          arrivalSchool: '',
          arrivalSchoolLocation: '',
          departureSchool: '',
          departureSchoolLocation: '',
          arrivalStop: '',
          arrivalStopLocation: ''
        }
      ]
    }));
  };

  const handleRemoveEntry = (idToRemove: string) => {
    if (formData.schedule.length <= 1) return; // Keep at least one line
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter(entry => entry.id !== idToRemove)
    }));
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    // Use a timeout to allow the UI to update to the loading state first
    setTimeout(() => {
        try {
            const jspdf = (window as any).jspdf;
            if (!jspdf || !jspdf.jsPDF) {
                throw new Error("Die jsPDF-Bibliothek (jspdf) konnte nicht geladen werden.");
            }
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            if (typeof (doc as any).autoTable !== 'function') {
                throw new Error("Das jspdf-autotable-Plugin konnte nicht geladen werden.");
            }

            const studentName = `${formData.firstName.trim() || 'N/A'} ${formData.lastName.trim() || 'N/A'}`;
            const fileName = `Antrag_${formData.lastName.trim() || 'Name'}_${formData.firstName.trim() || 'Vorname'}.pdf`;

            // --- Document Header ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text("Schülerbeförderungsantrag", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Name des Schülers / der Schülerin: ${studentName}`, 14, 40);

            // --- Table Content (Robust Two-Row Approach with RowSpan) ---
            const head = [['Tag', 'Abfahrt Haltestelle', 'Ankunft Schule', 'Abfahrt Schule', 'Ankunft Haltestelle']];
            const body: any[] = [];

            formData.schedule.forEach(entry => {
                const timeRow = [
                    { content: entry.day, rowSpan: 2, styles: { valign: 'middle', fontStyle: 'bold' } },
                    entry.departureStop || '-',
                    entry.arrivalSchool || '-',
                    entry.departureSchool || '-',
                    entry.arrivalStop || '-'
                ];
                const locationRow = [
                    // The first cell is skipped due to rowSpan
                    `(${entry.departureStopLocation || 'N/A'})`,
                    `(${entry.arrivalSchoolLocation || 'N/A'})`,
                    `(${entry.departureSchoolLocation || 'N/A'})`,
                    `(${entry.arrivalStopLocation || 'N/A'})`
                ];
                body.push(timeRow);
                body.push(locationRow);
            });

            // --- Generate Table with Custom Styling for Rows ---
            (doc as any).autoTable({
                head,
                body,
                startY: 50,
                theme: 'striped',
                headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center' },
                styles: { cellPadding: 2, fontSize: 9, valign: 'middle' },
                columnStyles: { 
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                },
                didParseCell: function (data: any) {
                    // Style location rows (second row of a pair)
                    if (data.row.index % 2 !== 0) {
                        data.cell.styles.textColor = [100, 116, 139]; // slate-500
                        data.cell.styles.fontSize = 8;
                    } else {
                         // Style time rows (first row of a pair)
                         data.cell.styles.fontStyle = 'bold';
                    }
                },
            });

            // --- Draw signatures ---
            const finalY = (doc as any).lastAutoTable.finalY;
            const pageHeight = doc.internal.pageSize.getHeight();
            const bottomMargin = 20;
            let signatureY = finalY + 20;

            // Add a new page if signatures don't fit
            if (finalY > pageHeight - (bottomMargin + 20)) {
                doc.addPage();
                signatureY = 30;
            }
            
            doc.setFontSize(10);
            doc.setLineWidth(0.2);
            doc.setDrawColor(0,0,0);

            const margin = 14;
            const leftText = "Datum, Unterschrift Erziehungsberechtigte/r";
            doc.line(margin, signatureY, margin + 85, signatureY);
            doc.text(leftText, margin, signatureY + 5);
            
            const rightText = "Stempel und Unterschrift der Schule";
            const pageWidth = doc.internal.pageSize.getWidth();
            const rightX = pageWidth - margin;
            doc.line(rightX, signatureY, rightX - 85, signatureY);
            doc.text(rightText, rightX, signatureY + 5, { align: 'right' });


            // --- Save Document ---
            doc.save(fileName);

        } catch (error) {
            console.error("Fehler bei der PDF-Generierung:", error);
            alert(`Ein Fehler ist aufgetreten: ${(error as Error).message}. Bitte versuchen Sie es später erneut.`);
        } finally {
            setIsGeneratingPdf(false);
        }
    }, 100);
  };


  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold">Antrag auf Schülerbeförderung</h2>
        </div>

        <section className="mb-8">
          <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">Angaben zum Schüler / zur Schülerin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-600 mb-1">Vorname</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Max"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-600 mb-1">Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Mustermann"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">Benötigte Fahrzeiten</h3>
          <div>
             <div className="hidden lg:grid grid-cols-12 gap-x-2 text-xs font-semibold text-slate-500 uppercase px-2 pb-2 border-b items-end">
              <div className="col-span-2">Wochentag</div>
              <div className="col-span-1">Abf. Hst.</div>
              <div className="col-span-2">Ort Haltestelle</div>
              <div className="col-span-1">Ank. Schule</div>
              <div className="col-span-1">Ort Schule</div>
              <div className="col-span-1">Abf. Schule</div>
              <div className="col-span-1">Ort Schule</div>
              <div className="col-span-1">Ank. Hst.</div>
              <div className="col-span-1">Ort Haltestelle</div>
              <div className="col-span-1"></div>
            </div>

            {formData.schedule.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-2 lg:grid-cols-12 gap-x-2 gap-y-3 items-center border-b last:border-b-0 py-3">
                <div className="col-span-2 lg:col-span-2">
                  <label className="lg:hidden text-xs font-medium text-slate-500 uppercase">Wochentag</label>
                   <select
                    name="day"
                    value={entry.day}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    {SCHOOL_WEEKDAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Abfahrt Hst.</label>
                  <input
                    type="time"
                    name="departureStop"
                    value={entry.departureStop}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                 <div className="col-span-1 lg:col-span-2">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ort Haltestelle</label>
                  <input
                    type="text"
                    name="departureStopLocation"
                    value={entry.departureStopLocation}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Haltestelle"
                  />
                </div>

                <div className="col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ankunft Schule</label>
                  <input
                    type="time"
                    name="arrivalSchool"
                    value={entry.arrivalSchool}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="col-span-1 lg:col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ort Schule</label>
                  <input
                    type="text"
                    name="arrivalSchoolLocation"
                    value={entry.arrivalSchoolLocation}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Schule"
                  />
                </div>

                <div className="col-span-1 lg:col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Abfahrt Schule</label>
                  <input
                    type="time"
                    name="departureSchool"
                    value={entry.departureSchool}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="col-span-1 lg:col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ort Schule</label>
                  <input
                    type="text"
                    name="departureSchoolLocation"
                    value={entry.departureSchoolLocation}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Schule"
                  />
                </div>

                <div className="col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ankunft Hst.</label>
                  <input
                    type="time"
                    name="arrivalStop"
                    value={entry.arrivalStop}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="col-span-1 lg:col-span-1">
                   <label className="lg:hidden text-xs font-medium text-slate-500">Ort Haltestelle</label>
                  <input
                    type="text"
                    name="arrivalStopLocation"
                    value={entry.arrivalStopLocation}
                    onChange={(e) => handleScheduleChange(index, e)}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Haltestelle"
                  />
                </div>

                 <div className="col-span-2 lg:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(entry.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label="Zeile entfernen"
                    disabled={formData.schedule.length <= 1}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleAddEntry}
          disabled={formData.schedule.length >= SCHOOL_WEEKDAYS.length}
          className="flex items-center justify-center px-4 py-2 border border-dashed border-slate-400 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon />
          Wochentag hinzufügen
        </button>
         <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-wait"
        >
          {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PDF wird erstellt...
              </>
          ) : (
              <>
                <DownloadIcon />
                PDF Herunterladen
              </>
          )}
        </button>
      </div>
    </>
  );
};

export default TransportationForm;
