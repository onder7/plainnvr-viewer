/**
 * Calendar component with recording date highlighting
 */
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getRecordingDates } from '../api/client';

interface CalendarPickerProps {
  cameraId: string | null;
  onSelectDate: (date: Date) => void;
}

export default function CalendarPicker({
  cameraId,
  onSelectDate,
}: CalendarPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [recordingDays, setRecordingDays] = useState<number[]>([]);

  // Fetch recording dates when camera or month changes
  useEffect(() => {
    if (!cameraId) {
      setRecordingDays([]);
      return;
    }

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed

    getRecordingDates(cameraId, year, month)
      .then((data) => setRecordingDays(data.days))
      .catch((err) => console.error('Failed to fetch recording dates:', err));
  }, [cameraId, selectedDate.getFullYear(), selectedDate.getMonth()]);

  const handleDateChange = (value: Date | null) => {
    if (value) {
      setSelectedDate(value);
      onSelectDate(value);
    }
  };

  // Highlight tiles with recordings
  const tileClassName = ({ date }: { date: Date }) => {
    if (
      date.getMonth() === selectedDate.getMonth() &&
      recordingDays.includes(date.getDate())
    ) {
      return 'has-recordings';
    }
    return null;
  };

  return (
    <div className="calendar-picker">
      <h2>Tarih Seç</h2>
      <Calendar
        onChange={handleDateChange as any}
        value={selectedDate}
        tileClassName={tileClassName}
      />
      <style>{`
        .has-recordings {
          background-color: #90cdf4 !important;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
