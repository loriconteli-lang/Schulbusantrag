import React, { useState } from 'react';
import type { FormData, ScheduleEntry, Student } from '../types';
import { DownloadIcon, PlusIcon, TrashIcon } from './icons';

const SCHOOL_WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const TransportationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    students: [{ id: crypto.randomUUID(), firstName: '', lastName: '' }],
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
  const [locations, setLocations] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleStudentChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newStudents = formData.students.map(student => 
      student.id === id ? { ...student, [name]: value } : student
    );
    setFormData(prev => ({ ...prev, students: newStudents }));
  };

  const handleAddStudent = () => {
    setFormData(prev => ({
      ...prev,
      students: [...prev.students, { id: crypto.randomUUID(), firstName: '', lastName: '' }]
    }));
  };

  const handleRemoveStudent = (idToRemove: string) => {
    if (formData.students.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      students: prev.students.filter(student => student.id !== idToRemove)
    }));
  };

  const handleScheduleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [name]: value };
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const handleLocationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newLocation = e.target.value.trim();
    if (newLocation && !locations.includes(newLocation)) {
      setLocations(prev => [...prev, newLocation].sort());
    }
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
    if (formData.schedule.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter(entry => entry.id !== idToRemove)
    }));
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
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

            const studentNames = formData.students
                .map(s => `${s.firstName.trim()} ${s.lastName.trim()}`)
                .filter(name => name.trim() !== '')
                .join(', ') || 'N/A';

            const firstStudent = formData.students[0] || { lastName: 'Name', firstName: 'Vorname' };
            const fileName = formData.students.length > 1
                ? `Antrag_${firstStudent.lastName.trim() || 'Gruppe'}_und_weitere.pdf`
                : `Antrag_${firstStudent.lastName.trim() || 'Name'}_${firstStudent.firstName.trim() || 'Vorname'}.pdf`;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text("Schülerbeförderungsantrag", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Antrag für: ${studentNames}`, 14, 40);

            const head = [['Tag', 'Abfahrt Haltestelle', 'Ankunft Schule', 'Abfahrt Schule', 'Ankunft Haltestelle']];
            const body: any[] = [];

            formData.schedule.forEach(entry => {
                const timeRow = [
                    { content: entry.day, rowSpan: 2, styles: { valign: 'middle', fontStyle: 'bold' } },
                    { content: entry.departureStop || '-' },
                    { content: entry.arrivalSchool || '-' },
                    { content: entry.departureSchool || '-' },
                    { content: entry.arrivalStop || '-' }
                ];
                const locationRow = [
                    { content: `(${entry.departureStopLocation || 'N/A'})` },
                    { content: `(${entry.arrivalSchoolLocation || 'N/A'})` },
                    { content: `(${entry.departureSchoolLocation || 'N/A'})` },
                    { content: `(${entry.arrivalStopLocation || 'N/A'})` }
                ];
                body.push(timeRow);
                body.push(locationRow);
            });

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
                    if (data.row.section === 'body') {
                        if (data.row.index % 2 !== 0) {
                            data.cell.styles.textColor = [100, 116, 139];
                            data.cell.styles.fontSize = 8;
                        } else {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
            });

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
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
      <datalist id="locations-list">
        {locations.map(loc => <option key={loc} value={loc} />)}
      </datalist>
      <div className="mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold">Antrag auf Schülerbeförderung</h2>
      </div>

      <section className="mb-8">
        <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">Angaben zum Schüler / zur Schülerin</h3>
        <div className="space-y-4">
            {formData.students.map((student) => (
              <div key={student.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-x-6 gap-y-2 items-end">
                <div>
                  <label htmlFor={`firstName-${student.id}`} className="block text-sm font-medium text-slate-600 mb-1">Vorname</label>
                  <input
                    type="text"
                    id={`firstName-${student.id}`}
                    name="firstName"
                    value={student.firstName}
                    onChange={(e) => handleStudentChange(student.id, e)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label htmlFor={`lastName-${student.id}`} className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    id={`lastName-${student.id}`}
                    name="lastName"
                    value={student.lastName}
                    onChange={(e) => handleStudentChange(student.id, e)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Mustermann"
                  />
                </div>
                <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    aria-label="Schüler entfernen"
                    disabled={formData.students.length <= 1}
                >
                    <TrashIcon />
                </button>
              </div>
            ))}
             <button
                type="button"
                onClick={handleAddStudent}
                className="mt-2 flex items-center justify-center px-3 py-1.5 border border-dashed border-slate-400 text-xs font-medium rounded-md shadow-sm text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                <PlusIcon />
                Weiteren Schüler hinzufügen
            </button>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">Benötigte Fahrzeiten (gemeinsam für alle oben genannten Schüler)</h3>
        <div className="space-y-6">
          {formData.schedule.map((entry, index) => (
            <div key={entry.id} className="p-4 border rounded-md relative bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                     <div className="w-1/2 md:w-1/3">
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Wochentag</label>
                        <select
                            name="day"
                            value={entry.day}
                            onChange={(e) => handleScheduleChange(index, e)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                        >
                            {SCHOOL_WEEKDAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                    <div className="absolute top-3 right-3">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Hinfahrt */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-slate-600 text-sm">Hinfahrt (zur Schule)</h4>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt</label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    name="departureStop"
                                    value={entry.departureStop}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                <input
                                    type="text"
                                    name="departureStopLocation"
                                    value={entry.departureStopLocation}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    onBlur={handleLocationBlur}
                                    list="locations-list"
                                    className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ort der Haltestelle"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft</label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    name="arrivalSchool"
                                    value={entry.arrivalSchool}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                <input
                                    type="text"
                                    name="arrivalSchoolLocation"
                                    value={entry.arrivalSchoolLocation}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    onBlur={handleLocationBlur}
                                    list="locations-list"
                                    className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ort der Schule"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Rückfahrt */}
                    <div className="space-y-3">
                         <h4 className="font-semibold text-slate-600 text-sm">Rückfahrt (nach Hause)</h4>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt</label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    name="departureSchool"
                                    value={entry.departureSchool}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                <input
                                    type="text"
                                    name="departureSchoolLocation"
                                    value={entry.departureSchoolLocation}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    onBlur={handleLocationBlur}
                                    list="locations-list"
                                    className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ort der Schule"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft</label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    name="arrivalStop"
                                    value={entry.arrivalStop}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                                <input
                                    type="text"
                                    name="arrivalStopLocation"
                                    value={entry.arrivalStopLocation}
                                    onChange={(e) => handleScheduleChange(index, e)}
                                    onBlur={handleLocationBlur}
                                    list="locations-list"
                                    className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ort der Haltestelle"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
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
    </div>
  );
};

export default TransportationForm;
