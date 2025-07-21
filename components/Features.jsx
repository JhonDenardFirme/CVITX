'use client'

import { useEffect } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

const Features = () => {

  useEffect(() => {
    AOS.init({duration: 1000, delay:100})
  }, []);

  return (
    <div className="flex flex-col h-[450px] justify-center items-center z-40 mt-52 mb-16">

      <h1 className="text-4xl font-medium"> SUPPORTED <span className="text-gradient-blue font-extrabold" data-aos="fade-up"> FINE-GRAINED</span></h1>
      <h1 className="text-4xl font-medium mb-8">VEHICLE INFORMATION</h1>

    <div className="px-32 grid grid-cols-5 gap-16 h-56 w-full relative mt-16">



      <div className="flex flex-col w-full justify-center items-center feature-card border-[1px] border-neutral-500"
        data-aos="fade-up" data-aos-delay="200"
      >
        <div className="rounded-full border-[1px] border-neutral-500 p-4 mb-6 absolute -top-8 bg-neutral-950 z-10">
          <img src="/shape.svg" className="w-8 object-cover"></img>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient-blue">TYPE</h1>
        <p className="text-white text-sm text-center w-[80%] font-light ">
        Defines the broad vehicle category
        </p>

      </div>


      <div className="flex flex-col w-full justify-center items-center feature-card border-[1px] border-neutral-500"
        data-aos="fade-up" data-aos-delay="400"
      >
        <div className="rounded-full border-[1px] border-neutral-500 p-4 mb-6 absolute -top-8 bg-neutral-950 z-10">
          <img src="/color.svg" className="w-8 object-cover"></img>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient-blue">MAKE</h1>
        <p className="text-white text-sm text-center w-[80%] font-light ">
        Identifies the manufacturer brand

        </p>

      </div>


      <div className="flex flex-col w-full justify-center items-center feature-card border-[1px] border-neutral-500"
        data-aos="fade-up" data-aos-delay="600">
        <div className="rounded-full border-[1px] border-neutral-500 p-4 mb-6 absolute -top-8 bg-neutral-950 z-10">
          <img src="/emotion.svg" className="w-8 object-cover"></img>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient-blue">MODEL</h1>
        <p className="text-white text-sm text-center w-[80%] font-light">
        Specifies the vehicle variant
        </p>

      </div>

      <div className="flex flex-col w-full justify-center items-center feature-card border-[1px] border-neutral-500"
        data-aos="fade-up" data-aos-delay="800">
        <div className="rounded-full border-[1px] border-neutral-500 p-4 mb-6 absolute -top-8 bg-neutral-950 z-10">
          <img src="/item.svg" className="w-8 object-cover"></img>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient-blue">PLATE</h1>
        <p className="text-white text-sm text-center w-[80%] font-light">
        Records the license-plate identifier
        </p>

      </div>

      <div className="flex flex-col w-full justify-center items-center feature-card border-[1px] border-neutral-500"
        data-aos="fade-up" data-aos-delay="1000">
        <div className="rounded-full border-[1px] border-neutral-500 p-4 mb-6 absolute -top-8 bg-neutral-950 z-10">
          <img src="/recipe.svg" className="w-8 object-cover"></img>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-gradient-blue">METADATA</h1>
        <p className="text-white text-sm text-center w-[80%] font-light">
        Captures timestamps and location details
        </p>

      </div>



      <div className="absolute blue-gradient w-[200px] h-[200px] -z-10 -top-64 -right-32"></div>
        
      <div className="absolute lightblue-gradient w-[200px] h-[200px] -z-10 -top-64 -right-32"></div>


    </div>
    </div>
    
  )
}

export default Features