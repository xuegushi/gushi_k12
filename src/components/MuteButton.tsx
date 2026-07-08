import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isMuted, toggleMute, onMuteChange } from '../lib/audio'

export default function MuteButton() {
  var [muted, setMuted] = useState(isMuted)

  useEffect(function() {
    return onMuteChange(function() { setMuted(isMuted()) })
  }, [])

  return (
    <button onClick={toggleMute}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={muted ? '取消静音' : '静音'}>
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  )
}
