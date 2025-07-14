"use client"



import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { MoreVertical } from "lucide-react"








import { useState, useEffect } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronDown, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  vehicleTypes,
  vehicleColors,
  allVehicleMakes,
  allVehicleModels,
} from "@/lib/constants" // <- adjust path accordingly

const options = {
  type: vehicleTypes,
  color: vehicleColors,
  make: allVehicleMakes,
  model: allVehicleModels,
}


export default function IndexingRecords({ onViewRecord }) {
  
  const [selected, setSelected] = useState({
    type: [],      
    color: [],    
    make: [],      
    model: [],    
    plate: "",     
  })



  // Dummy data

  const [records, setRecords] = useState([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/data/indexing-records.json") // must be in /public/data/
      const json = await res.json()
      setRecords(json)
    }

    fetchData()
  }, [])



  const filteredData = filterVehicles(records, selected);
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);





  const toggleSelection = (key, value) => {
    setSelected((prev) => {
      const already = prev[key].includes(value)
      return {
        ...prev,
        [key]: already
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      }
    })
  }

  const renderSelect = (label, key) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button className="w-full h-12 p-2 px-4 rounded-md border border-neutral-700 bg-neutral-900 flex items-center justify-between text-sm text-white hover:bg-neutral-800">
          {selected[key].length > 0 ? (
            <span>
              {selected[key].slice(0, 2).join(", ")}
              {selected[key].length > 2 && ` +${selected[key].length - 2}`}
            </span>
          ) : (
            <span>Select {label}</span>
          )}
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-neutral-900 border border-neutral-700">
        <Command>
          <CommandInput placeholder={`Search ${label}`} className="text-white" />
          <CommandList>
            {Array.isArray(options[key]) &&
              options[key].map((opt) => (
                <CommandItem
                  key={opt}
                  onSelect={() => toggleSelection(key, opt)}
                  className="text-sm cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-1 h-4 w-4 text-orange-500",
                      selected[key].includes(opt) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt}
                </CommandItem>
              ))}

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )


  function filterVehicles(data, filters) {
  return data.filter((vehicle) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        return true;
      }

      // Map filter key to vehicle key
      const keyMap = {
        type: "vehicle_type",
        color: "color",
        make: "make",
        model: "model",
        plate: "plate_number",
      };
      const vehicleKey = keyMap[key];
      let vehicleValue = vehicle[vehicleKey];

      if (!vehicleValue || vehicleValue === "NULL") {
        return false;
      }

      vehicleValue = vehicleValue.toLowerCase();

      // Plate search: case-insensitive substring
      if (key === "plate") {
        return vehicleValue.includes(value.toLowerCase());
      }

      // Array match (multi-selects)
      if (Array.isArray(value)) {
        return value.map((v) => v.toLowerCase()).includes(vehicleValue);
      }

      return vehicleValue === value.toLowerCase();
    });
  });
}







  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start">
      {/* Header */}
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          <img src="/icons/indexing.svg" alt="Indexing" className="w-6 h-6" />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800"></div>
          <p className="text-md">Indexing Records</p>
        </div>

        <button className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center">
          <Download size={14} />
          Download CSV
        </button>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800 mt-2 mb-8"></div>

      {/* Filters (Single Row) */}
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-4 w-full mb-6">
        {renderSelect("Vehicle Type", "type")}
        {renderSelect("Color", "color")}
        {renderSelect("Make", "make")}
        {renderSelect("Model", "model")}
        <Input
          type="text"
          placeholder="Plate Number"
          className="w-full h-12 text-sm text-white bg-neutral-900 border border-neutral-700 placeholder:text-neutral-400"
          value={selected.plate}
          onChange={(e) =>
            setSelected((prev) => ({ ...prev, plate: e.target.value }))
          }
        />
        <Button
          className="bg-orange-500 h-12 hover:bg-orange-400 text-white px-6 py-2 text-sm rounded-md"
          onClick={() => console.log("Submitted:", selected)}
        >
          Submit
        </Button>
      </div>







      {/* Table Section */}
    <div className="w-full mt-8 border border-neutral-800 rounded-lg overflow-hidden">
      <Table>
        {/* Table Header */}
        <TableHeader className="bg-neutral-900 border-b border-neutral-800">
          <TableRow>
            <TableHead className="text-white">ID</TableHead>
            <TableHead className="text-white">Vehicle Snapshot</TableHead>
            <TableHead className="text-white">Type</TableHead>
            <TableHead className="text-white">Color</TableHead>
            <TableHead className="text-white">Make</TableHead>
            <TableHead className="text-white">Model</TableHead>

            <TableHead className="text-white">Timestamp</TableHead>
            <TableHead className="text-white">Plate Number</TableHead>
            <TableHead className="text-right text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.uid} className="hover:bg-neutral-800">
              <TableCell className="text-xs">{item.uid}</TableCell>
              <TableCell>
                <div className="h-16 w-24 border border-neutral-800 rounded-sm overflow-hidden">
                  <img className="h-full w-full object-cover" src={item.image}></img>
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {item.vehicle_type === "UNCATEGORIZED" ? "-" : item.vehicle_type}
              </TableCell>
              <TableCell className="text-xs">
                {item.color ? item.color.toUpperCase() : "-"}
              </TableCell>
              <TableCell className="text-xs">
                {item.make === "UNCATEGORIZED" ? "-" : item.make}
              </TableCell>
              <TableCell className="text-xs">
                {item.model === "UNCATEGORIZED" ? "-" : item.model}
              </TableCell>

              
              <TableCell className="text-xs">
                {new Date(item.first_seen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} -{" "}
                {new Date(item.last_seen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
              </TableCell>



              <TableCell>
                <div className="h-16 w-24 flex flex-col gap-2 items-center justify-center">
                  <p className="text-xs">
                    {item.plate_number && item.plate_number !== "NULL" ? item.plate_number : "-"}
                  </p>

                  <div className="h-10 w-24 border border-neutral-800 rounded-sm overflow-hidden bg-neutral-900 flex items-center justify-center">
                    {item.plate_image && item.plate_image !== "NULL" ? (
                      <img
                        src={item.plate_image}
                        alt="Plate"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <p className="text-[10px] text-neutral-400">NO IMAGE</p>
                    )}
                  </div>
                </div>
              </TableCell>



              

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-700">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 bg-neutral-900 border border-neutral-700 text-white">
                      <DropdownMenuItem onClick={() => onViewRecord(item.uid)}>
                        View Record
                      </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Edit", item.uid)}>Add to Timeline</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Delete", item.uid)}>Edit</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>


    {/* Pagination */}
    <div className="flex justify-end p-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className="text-white"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            />
          </PaginationItem>
          <PaginationItem>
            <div className="text-sm text-neutral-400 px-2 pt-1">
              Page {page} of {Math.ceil(filteredData.length / itemsPerPage)}


            </div>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className="text-white"
              onClick={() =>
                setPage((prev) =>
                  prev < Math.ceil(records.length / itemsPerPage) ? prev + 1 : prev
                )
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>

      </div>

      </div>



    
  )
}

