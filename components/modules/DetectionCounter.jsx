"use client"

import { Circle } from "lucide-react"
import { Separator } from "../ui/separator"

const DetectionCounter = ({ cameraLabel }) => {
  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start overflow-y-auto scrollbar-none gap-4">
      {/* Header */}
      <div className="h-10 w-full rounded-md border border-neutral-700 px-4 flex items-center justify-center gap-2 shrink-0">
        <img src="/icons/detection.svg" className="w-4 h-4" />
        <p className="text-xs text-white">Detection Counter</p>
      </div>

      {/* People on Frame */}
      <div className="w-full flex-1 flex flex-col items-center justify-center rounded-md border border-neutral-700 p-4 shrink-0">
        <p className="text-6xl font-bold">150</p>
        <p className="text-xs mb-4">Vehicles Detected</p>

        <Separator />

      <div className="flex flex-col mt-4 items-center w-full">
        <div className="flex flex-row gap-1.5 items-center justify-center w-full">
          <div className="max-w-[80%] truncate text-xs text-white">
            {cameraLabel || "- No Camera -"}
          </div>
          <div
            className={`rounded-full w-2 h-2 mb-0.5 ${
              cameraLabel ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
        <p className="text-xs text-neutral-500">Source Feed</p>
      </div>

      </div>

      {/* People Flow Summary */}
      <div className="w-full flex-2 flex flex-col items-center justify-center rounded-md border border-neutral-700 p-4 shrink-0">


        <Separator />

        <div className="flex flex-col gap-2 items-center justify-center my-4">
          <p className="text-4xl font-bold ">98%</p>
          <p className="text-xs -mt-3 text-sky-500 font-light">Classification Rate</p>
        </div>

        <Separator />

        <div className="flex flex-row mt-4 w-full items-center justify-between">
          <div className="flex-1 flex flex-col gap-2 items-center justify-center">
            <p className="text-4xl font-bold">20</p>
            <p className="text-xs -mt-3 text-green-500 font-light">Categorized</p>
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col gap-2 items-center justify-center">
            <p className="text-4xl font-bold">2</p>
            <p className="text-xs -mt-3 text-red-500 font-light">Uncategorized</p>
          </div>
        </div>

        <Separator className="m-4" />

        <div className="flex items-center justify-center">
          <p className="text-xs text-neutral-500">WORKSPACE CODE</p>
          <div className="bg-neutral-600 w-2 h-[1px] mx-4" />
          <p className="text-xs text-neutral-500">CAM CODE</p>
        </div>

        <Separator className="m-4" />

        <p className="text-xs text-neutral-500">
          DATE OF VIDEO
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>


        <Separator className="mt-4"/>



      </div>
    </div>
  )
}

export default DetectionCounter
