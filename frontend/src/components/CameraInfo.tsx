import type { Camera } from '../types'

interface CameraInfoProps {
  camera: Camera
}

export default function CameraInfo({ camera }: CameraInfoProps) {
  const formatSchedule = () => {
    if (!camera.schedule) return 'Bilgi yok'
    
    if (camera.schedule.mode === 'always') {
      return '7/24 Sürekli Kayıt'
    }
    
    if (camera.schedule.mode === 'weekly' && camera.schedule.days) {
      const dayNames: { [key: string]: string } = {
        mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz'
      }
      
      const activeDays = Object.keys(camera.schedule.days).filter(
        day => camera.schedule!.days![day].length > 0
      )
      
      if (activeDays.length === 7) {
        const firstDay = activeDays[0]
        const times = camera.schedule.days[firstDay]
        if (times.length > 0) {
          return `Her gün ${times[0].start} - ${times[0].end}`
        }
      }
      
      const dayList = activeDays.map(d => dayNames[d] || d).join(', ')
      const firstDay = activeDays[0]
      const times = camera.schedule.days[firstDay]
      if (times.length > 0) {
        return `${dayList} | ${times[0].start}-${times[0].end}`
      }
      return dayList
    }
    
    return 'Haftalık Program'
  }

  return (
    <div className="panel-footnote camera-info">
      <div className="shield-icon">🛡️</div>
      <div>
        <b>Kayıt Zamanlaması:</b><br />
        {formatSchedule()}
        <br /><br />
        <b>Saklama Süresi:</b><br />
        {camera.retention_days ? `${camera.retention_days} gün` : 'Tanımlı değil'}
      </div>
    </div>
  )
}
