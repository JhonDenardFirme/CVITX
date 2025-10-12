"use client"

import { HardDriveUpload, UploadIcon } from "lucide-react"
import { useState, useRef } from "react"

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(":")
}

const dummyVideos = Array.from({ length: 7 }, (_, i) => {
  const n = (i % 3) + 1
  return {
    id: i,
    src: `/footage/footage${n}.mp4`,
    name: `footage${n}.mp4`
  }
})

const DetectionSummary = () => {
  const [durations, setDurations] = useState({})

  const handleMetadata = (id, e) => {
    setDurations((prev) => ({
      ...prev,
      [id]: e.target.duration
    }))
  }


  const fileInputRef = useRef(null)

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log("Selected file:", file.name)
      
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start">

      
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          <HardDriveUpload size={20} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800"></div>
          <p className="text-md">Footage Upload</p>
        </div>

        <button
          onClick={handleUploadClick}
          className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center"
        >
          <UploadIcon size={14}></UploadIcon>
          Upload Footage
        </button>

        <input
          type="file"
          accept=".mp4"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      

      <div className="h-[1px] w-full border-[1px] border-neutral-800 mt-2 mb-8"></div>


      <div className="h-auto w-full grid grid-cols-4 gap-4">
        {dummyVideos.map((video) => (
          <div
            key={video.id}
            className="flex flex-col gap-2 bg-neutral-900 rounded-lg overflow-hidden p-2"
          >
            <video
              src={video.src}
              onLoadedMetadata={(e) => handleMetadata(video.id, e)}
              controls
              className="rounded-md w-full h-40 object-cover"
            />

            <div className="flex flex-row w-full justify-between items-center">
                <p className="text-xs text-white truncate">{video.name}</p>
                <p className="text-xs text-muted-foreground">
                  {durations[video.id] ? formatTime(durations[video.id]) : "--:--:--"}
                </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default DetectionSummary
