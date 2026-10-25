import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { getRecordingDates } from '../api/client'

interface CalendarPickerProps { cameraId: string | null; onSelectDate: (date: Date) => void }

export default function CalendarPicker({ cameraId, onSelectDate }: CalendarPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [recordingDays, setRecordingDays] = useState<number[]>([])

  useEffect(() => {
    if (!cameraId) return
    const controller = new AbortController()
    getRecordingDates(cameraId, selectedDate.getFullYear(), selectedDate.getMonth() + 1, controller.signal)
      .then((data) => setRecordingDays(data.days))
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') setRecordingDays([])
      })
    return () => controller.abort()
  }, [cameraId, selectedDate])

  const handleDateChange = (value: Date | null) => { if (value) { setSelectedDate(value); onSelectDate(value) } }
  const tileClassName = ({ date }: { date: Date }) => recordingDays.includes(date.getDate()) && date.getMonth() === selectedDate.getMonth() ? 'has-recordings' : null

  return <div className="calendar-picker"><Calendar onChange={handleDateChange as any} value={selectedDate} tileClassName={tileClassName} locale="tr-TR" /></div>
}
