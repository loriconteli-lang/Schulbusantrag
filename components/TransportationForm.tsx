import React, { useState } from 'react';
import type { FormData, ScheduleEntry, Student } from '../types';
import { DownloadIcon, PlusIcon, TrashIcon, ClockIcon } from './icons';

const SCHOOL_WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const initialScheduleEntry: Omit<ScheduleEntry, 'id' | 'day'> = {
  departureStopMorning: '',
  departureStopLocationMorning: '',
  arrivalSchoolMorning: '',
  arrivalSchoolLocationMorning: '',
  departureSchoolMorning: '',
  departureSchoolLocationMorning: '',
  arrivalStopMorning: '',
  arrivalStopLocationMorning: '',
  departureStopAfternoon: '',
  departureStopLocationAfternoon: '',
  arrivalSchoolAfternoon: '',
  arrivalSchoolLocationAfternoon: '',
  departureSchoolAfternoon: '',
  departureSchoolLocationAfternoon: '',
  arrivalStopAfternoon: '',
  arrivalStopLocationAfternoon: ''
};

const TransportationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    requestType: 'group',
    students: [{ id: crypto.randomUUID(), firstName: '', lastName: '', street: '', zipCode: '', city: '' }],
    schedule: [{
      id: crypto.randomUUID(),
      day: 'Montag',
      ...initialScheduleEntry,
    }],
    groupNames: [''],
    studentCount: '',
    responsibleTeacher: '',
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleRequestTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, requestType: value as 'single' | 'group' }));
  };
  
  const handleGroupDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupNameChange = (index: number, value: string) => {
    const newGroupNames = [...formData.groupNames];
    newGroupNames[index] = value;
    setFormData(prev => ({ ...prev, groupNames: newGroupNames }));
  };

  const handleAddGroupName = () => {
    setFormData(prev => ({ ...prev, groupNames: [...prev.groupNames, ''] }));
  };

  const handleRemoveGroupName = (indexToRemove: number) => {
    if (formData.groupNames.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      groupNames: formData.groupNames.filter((_, index) => index !== indexToRemove)
    }));
  };

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
      students: [...prev.students, { id: crypto.randomUUID(), firstName: '', lastName: '', street: '', zipCode: '', city: '' }]
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
    newSchedule[index] = { ...newSchedule[index], [name]: value as string };
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
          ...initialScheduleEntry
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
            
            let fileName = 'Antrag.pdf';
            if (formData.requestType === 'group') {
                const validGroupNames = formData.groupNames.map(n => n.trim()).filter(Boolean);
                const pdfGroupName = validGroupNames.length > 1 
                    ? `${validGroupNames[0]}_und_weitere` 
                    : validGroupNames[0] || 'Unbenannt';
                fileName = `Antrag_Gruppe_${pdfGroupName.replace(/\s+/g, '_')}.pdf`;
            } else {
                const firstStudent = formData.students[0] || { lastName: 'Name', firstName: 'Vorname' };
                fileName = formData.students.length > 1
                    ? `Antrag_${firstStudent.lastName.trim() || 'Gruppe'}_und_weitere.pdf`
                    : `Antrag_${firstStudent.lastName.trim() || 'Name'}_${firstStudent.firstName.trim() || 'Vorname'}.pdf`;
            }


            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text("Schülerbeförderungsantrag", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

            let currentY = 40;
            
            if (formData.requestType === 'single') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text("Angaben zu den Schülern", 14, currentY);
                currentY += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
    
                formData.students.forEach((student, index) => {
                  const name = `${student.firstName.trim()} ${student.lastName.trim()}`.trim();
                  const addressLine1 = student.street.trim();
                  const addressLine2 = `${student.zipCode.trim()} ${student.city.trim()}`.trim();
                  
                  if (name || addressLine1 || addressLine2) {
                    if (index > 0) {
                        currentY += 5; // Extra space between students
                    }
                    doc.setFont('helvetica', 'bold');
                    doc.text(name || 'Kein Name angegeben', 14, currentY);
                    currentY += 5;
                    
                    doc.setFont('helvetica', 'normal');
                    if (addressLine1) {
                        doc.text(addressLine1, 14, currentY);
                        currentY += 5;
                    }
                    if (addressLine2) {
                        doc.text(addressLine2, 14, currentY);
                        currentY += 5;
                    }
                  }
                });
            } else { // 'group'
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text("Angaben zur Gruppe", 14, currentY);
                currentY += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                
                const groupNameText = formData.groupNames.map(n => n.trim()).filter(Boolean).join(', ') || 'Kein Gruppenname angegeben';

                doc.setFont('helvetica', 'bold');
                doc.text(groupNameText, 14, currentY, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
                const groupNameLines = doc.splitTextToSize(groupNameText, doc.internal.pageSize.getWidth() - 28);
                currentY += 5 * groupNameLines.length;
    
                doc.setFont('helvetica', 'normal');
                doc.text(`Anzahl der Schüler: ${formData.studentCount.trim() || 'N/A'}`, 14, currentY);
                currentY += 5;
                doc.text(`Verantwortliche Lehrperson: ${formData.responsibleTeacher.trim() || 'N/A'}`, 14, currentY);
                currentY += 5;
            }


            const tableStartY = currentY + 10;
            
            if (formData.requestType === 'single') {
                const head = [['Tag', 'Abfahrt Haltestelle', 'Ankunft Schule', 'Abfahrt Schule', 'Ankunft Haltestelle']];
                const body: any[] = [];
                 formData.schedule.forEach(entry => {
                    const morningTimeRow = [
                        { content: entry.day, rowSpan: 4, styles: { valign: 'middle', fontStyle: 'bold' } },
                        { content: entry.departureStopMorning || '-' },
                        { content: entry.arrivalSchoolMorning || '-' },
                        { content: entry.departureSchoolMorning || '-' },
                        { content: entry.arrivalStopMorning || '-' }
                    ];
                    const morningLocationRow = [
                        { content: `(${entry.departureStopLocationMorning || 'Vormittag'})` },
                        { content: `(${entry.arrivalSchoolLocationMorning || 'N/A'})` },
                        { content: `(${entry.departureSchoolLocationMorning || 'N/A'})` },
                        { content: `(${entry.arrivalStopLocationMorning || 'N/A'})` }
                    ];
                    const afternoonTimeRow = [
                        { content: entry.departureStopAfternoon || '-' },
                        { content: entry.arrivalSchoolAfternoon || '-' },
                        { content: entry.departureSchoolAfternoon || '-' },
                        { content: entry.arrivalStopAfternoon || '-' }
                    ];
                    const afternoonLocationRow = [
                        { content: `(${entry.departureStopLocationAfternoon || 'Nachmittag'})` },
                        { content: `(${entry.arrivalSchoolLocationAfternoon || 'N/A'})` },
                        { content: `(${entry.departureSchoolLocationAfternoon || 'N/A'})` },
                        { content: `(${entry.arrivalStopLocationAfternoon || 'N/A'})` }
                    ];
                    body.push(morningTimeRow);
                    body.push(morningLocationRow);
                    body.push(afternoonTimeRow);
                    body.push(afternoonLocationRow);
                });
                
                (doc as any).autoTable({
                    head,
                    body,
                    startY: tableStartY,
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
                            const isLocationRow = data.row.index % 2 !== 0;
                            if (isLocationRow) {
                                 data.cell.styles.textColor = [100, 116, 139];
                                 data.cell.styles.fontSize = 8;
                            } else {
                                 data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    },
                });
            } else { // 'group'
                const head = [['Tag', 'Hinfahrt', 'Rückfahrt']];
                const body = formData.schedule.map(entry => {
                    const hinfahrtAbfahrt = `${entry.departureStopMorning || '--:--'} (${entry.departureStopLocationMorning || 'N/A'})`;
                    const hinfahrtAnkunft = `${entry.arrivalSchoolMorning || '--:--'} (${entry.arrivalSchoolLocationMorning || 'N/A'})`;
                    const hinfahrtText = `Abfahrt: ${hinfahrtAbfahrt}\nAnkunft: ${hinfahrtAnkunft}`;

                    const rueckfahrtAbfahrt = `${entry.departureSchoolMorning || '--:--'} (${entry.departureSchoolLocationMorning || 'N/A'})`;
                    const rueckfahrtAnkunft = `${entry.arrivalStopMorning || '--:--'} (${entry.arrivalStopLocationMorning || 'N/A'})`;
                    const rueckfahrtText = `Abfahrt: ${rueckfahrtAbfahrt}\nAnkunft: ${rueckfahrtAnkunft}`;
                    
                    return [entry.day, hinfahrtText.trim(), rueckfahrtText.trim()];
                });
                
                (doc as any).autoTable({
                    head,
                    body,
                    startY: tableStartY,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
                    styles: { cellPadding: 2, fontSize: 9, valign: 'middle', halign: 'left' },
                    columnStyles: { 
                        0: { fontStyle: 'bold', cellWidth: 30 },
                    },
                });
            }

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

      <div className="mb-6 pb-6 border-b">
        <h2 className="text-xl font-semibold mb-3 text-slate-700">1. Antragsart wählen</h2>
        <div role="radiogroup" className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center p-3 border rounded-md has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 cursor-pointer transition-colors w-full">
                <input
                    type="radio"
                    name="requestType"
                    value="single"
                    checked={formData.requestType === 'single'}
                    onChange={handleRequestTypeChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-slate-800">Einzelantrag (für einen oder mehrere Schüler)</span>
            </label>
            <label className="flex items-center p-3 border rounded-md has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 cursor-pointer transition-colors w-full">
                <input
                    type="radio"
                    name="requestType"
                    value="group"
                    checked={formData.requestType === 'group'}
                    onChange={handleRequestTypeChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-slate-800">Gruppenantrag (z.B. für eine Klasse)</span>
            </label>
        </div>
      </div>

      {formData.requestType === 'single' ? (
        <section className="mb-8">
            <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">2. Angaben zum Schüler / zur Schülerin</h3>
            <div className="space-y-4">
                {formData.students.map((student) => (
                  <div key={student.id} className="p-4 border rounded-md relative bg-slate-50/50 transition-shadow hover:shadow-sm">
                    <div className="absolute top-3 right-3">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                      <div>
                        <label htmlFor={`street-${student.id}`} className="block text-sm font-medium text-slate-600 mb-1">Strasse und Hausnummer</label>
                        <input
                          type="text"
                          id={`street-${student.id}`}
                          name="street"
                          value={student.street}
                          onChange={(e) => handleStudentChange(student.id, e)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Musterstrasse 123"
                        />
                      </div>
                      <div>
                        <label htmlFor={`zipCode-${student.id}`} className="block text-sm font-medium text-slate-600 mb-1">PLZ</label>
                        <input
                          type="text"
                          id={`zipCode-${student.id}`}
                          name="zipCode"
                          value={student.zipCode}
                          onChange={(e) => handleStudentChange(student.id, e)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="12345"
                        />
                      </div>
                       <div>
                        <label htmlFor={`city-${student.id}`} className="block text-sm font-medium text-slate-600 mb-1">Ort</label>
                        <input
                          type="text"
                          id={`city-${student.id}`}
                          name="city"
                          value={student.city}
                          onChange={(e) => handleStudentChange(student.id, e)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Musterstadt"
                        />
                      </div>
                    </div>
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
      ) : (
        <section className="mb-8">
            <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">2. Angaben zur Gruppe</h3>
            <div className="p-4 border rounded-md bg-slate-50/50 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Klassenbezeichnung / Gruppenname</label>
                    <div className="space-y-2">
                      {formData.groupNames.map((groupName, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => handleGroupNameChange(index, e.target.value)}
                            className="w-full md:w-2/3 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="z.B. Klasse 3b, Schwimmgruppe"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGroupName(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            aria-label="Klasse entfernen"
                            disabled={formData.groupNames.length <= 1}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddGroupName}
                        className="mt-2 flex items-center justify-center px-3 py-1.5 border border-dashed border-slate-400 text-xs font-medium rounded-md shadow-sm text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <PlusIcon />
                        Weitere Klasse hinzufügen
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="studentCount" className="block text-sm font-medium text-slate-600 mb-1">Anzahl der Schüler</label>
                    <input
                      type="number"
                      id="studentCount"
                      name="studentCount"
                      value={formData.studentCount}
                      onChange={handleGroupDataChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="z.B. 25"
                    />
                  </div>
                  <div>
                    <label htmlFor="responsibleTeacher" className="block text-sm font-medium text-slate-600 mb-1">Verantwortliche Lehrperson</label>
                    <input
                      type="text"
                      id="responsibleTeacher"
                      name="responsibleTeacher"
                      value={formData.responsibleTeacher}
                      onChange={handleGroupDataChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Erika Mustermann"
                    />
                  </div>
                </div>
            </div>
        </section>
      )}


      <section>
        <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-700">3. Benötigte Fahrzeiten</h3>
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
                
                {formData.requestType === 'single' ? (
                  <div className="space-y-4">
                    {/* Vormittag */}
                    <div>
                      <h4 className="font-semibold text-md text-slate-800 mb-2 border-b border-slate-200 pb-1">Vormittag</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Hinfahrt */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt (Hinfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureStopMorning"
                                        value={entry.departureStopMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureStopLocationMorning"
                                        value={entry.departureStopLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ort der Haltestelle"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft (Hinfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalSchoolMorning"
                                        value={entry.arrivalSchoolMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalSchoolLocationMorning"
                                        value={entry.arrivalSchoolLocationMorning}
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
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt (Rückfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureSchoolMorning"
                                        value={entry.departureSchoolMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureSchoolLocationMorning"
                                        value={entry.departureSchoolLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ort der Schule"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft (Rückfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalStopMorning"
                                        value={entry.arrivalStopMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalStopLocationMorning"
                                        value={entry.arrivalStopLocationMorning}
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

                    {/* Nachmittag */}
                    <div>
                      <h4 className="font-semibold text-md text-slate-800 mb-2 border-b border-slate-200 pb-1">Nachmittag</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Hinfahrt */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt (Hinfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureStopAfternoon"
                                        value={entry.departureStopAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureStopLocationAfternoon"
                                        value={entry.departureStopLocationAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ort der Haltestelle"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft (Hinfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalSchoolAfternoon"
                                        value={entry.arrivalSchoolAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalSchoolLocationAfternoon"
                                        value={entry.arrivalSchoolLocationAfternoon}
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
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt (Rückfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureSchoolAfternoon"
                                        value={entry.departureSchoolAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureSchoolLocationAfternoon"
                                        value={entry.departureSchoolLocationAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ort der Schule"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft (Rückfahrt)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalStopAfternoon"
                                        value={entry.arrivalStopAfternoon}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalStopLocationAfternoon"
                                        value={entry.arrivalStopLocationAfternoon}
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
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-md text-slate-800">Hinfahrt</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureStopMorning"
                                        value={entry.departureStopMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureStopLocationMorning"
                                        value={entry.departureStopLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Abfahrtsort"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalSchoolMorning"
                                        value={entry.arrivalSchoolMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalSchoolLocationMorning"
                                        value={entry.arrivalSchoolLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ankunftsort"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-md text-slate-800">Rückfahrt</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Abfahrt</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="departureSchoolMorning"
                                        value={entry.departureSchoolMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="departureSchoolLocationMorning"
                                        value={entry.departureSchoolLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Abfahrtsort"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ankunft</label>
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        name="arrivalStopMorning"
                                        value={entry.arrivalStopMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        className="w-1/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    />
                                    <input
                                        type="text"
                                        name="arrivalStopLocationMorning"
                                        value={entry.arrivalStopLocationMorning}
                                        onChange={(e) => handleScheduleChange(index, e)}
                                        onBlur={handleLocationBlur}
                                        list="locations-list"
                                        className="w-2/3 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        placeholder="Ankunftsort"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}
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