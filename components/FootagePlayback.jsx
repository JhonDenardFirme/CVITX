"use client"

import { useRef, useState, useEffect } from "react"


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':')
}

const FootagePlayback = () => {
  const [videoIndex, setVideoIndex] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [inputTime, setInputTime] = useState("00:00:00")

  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration || 0);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);

    // **NEW**: immediately set them in case events already fired
    updateDuration();
    updateTime();

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [videoIndex]);

  const handlePlay = () => {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  const handlePause = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const handlePrevFrame = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 1 / 24, 0)
      setIsPlaying(false)
    }
  }

  const handleNextFrame = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime += 1 / 24
      setIsPlaying(false)
    }
  }

  const handlePrevVideo = () => {
    setVideoIndex((prev) => Math.max(prev - 1, 1))
    setIsPlaying(false)
  }

  const handleNextVideo = () => {
    setVideoIndex((prev) => prev + 1)
    setIsPlaying(false)
  }

  const handleTimeInput = () => {
    const [hh, mm, ss] = inputTime.split(":").map(Number)
    const newTime = hh * 3600 + mm * 60 + ss
    if (!isNaN(newTime) && videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    setIsEditingTime(false)
  }






  return (
    <div className="w-full h-full flex flex-col p-8 items-center">
      <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-between">
        <div className="w-64 h-8 px-4 gap-4 flex flex-row items-center justify-start">
          <img src="/icons/video.svg" alt="Video" className="w-4 h-4" />

          <Select value={videoIndex.toString()} onValueChange={(val) => setVideoIndex(Number(val))}>
            <SelectTrigger className="w-40 h-8 text-xs px-1 py-2">
              <SelectValue placeholder={`footage${videoIndex}.mp4`} />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((n) => (
                <SelectItem key={n} value={n.toString()} className="text-xs">
                  footage{n}.mp4
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        
        <div className="w-64 h-8 px-4  flex flex-row items-center justify-center">
          <p className="text-xs text-white truncate">
            footage{videoIndex}.mp4
          </p>
        </div>


        <div className="w-64 h-8 px-4 gap-2 flex flex-row items-center justify-end">
          <img src="/icons/hd.svg" alt="Next Video" className="w-4 h-4" />
          <p className="text-xs text-muted-foreground">1920 × 1080</p>
        </div>

      </div>


      <div className="h-[80%] w-auto rounded-xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          key={videoIndex}
          src={`/footage/footage${videoIndex}.mp4`}
          className="h-full w-auto object-contain rounded-xl"
          controls={false}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        />
      </div>

      <div className="w-full mt-4 flex items-center gap-4 px-4">
        {isEditingTime ? (
          <input
            type="text"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            onBlur={handleTimeInput}
            onKeyDown={(e) => e.key === "Enter" && handleTimeInput()}
            className="bg-neutral-800 text-white rounded px-2 py-0.5 w-[72px] text-sm text-center"
          />
        ) : (
          <span
            onClick={() => {
              setInputTime(formatTime(currentTime))
              setIsEditingTime(true)
            }}
            className="text-sm text-orange-500 cursor-pointer tabular-nums w-[72px] text-center"
          >
            {formatTime(currentTime)}
          </span>
        )}

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => {
            const newTime = parseFloat(e.target.value)
            setCurrentTime(newTime)
            if (videoRef.current) videoRef.current.currentTime = newTime
          }}
          className="flex-1 accent-orange-500 h-1 rounded-lg appearance-none bg-neutral-700"
        />

        <span className="text-sm text-white tabular-nums w-[72px] text-center">
          {formatTime(duration)}
        </span>
      </div>

      <div className="w-full h-[10%] mt-4 flex items-center justify-center gap-4 bg-neutral-900 rounded-sm px-6">
        <button onClick={handlePrevVideo} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
          <img src="/icons/prev.svg" alt="Previous Video" className="w-5 h-5" />
        </button>
        <button onClick={handlePrevFrame} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
          <img src="/icons/prevframe.svg" alt="Previous Frame" className="w-5 h-5" />
        </button>
        {isPlaying ? (
          <button onClick={handlePause} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
            <img src="/icons/pause.svg" alt="Pause" className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handlePlay} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
            <img src="/icons/play.svg" alt="Play" className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleNextFrame} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
          <img src="/icons/nextframe.svg" alt="Next Frame" className="w-5 h-5" />
        </button>
        <button onClick={handleNextVideo} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700">
          <img src="/icons/next.svg" alt="Next Video" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default FootagePlayback
