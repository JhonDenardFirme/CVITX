'use client'

import { useEffect } from "react"
import AOS from 'aos';
import 'aos/dist/aos.css';



const Intro = () => {

  useEffect (() => {
    AOS.init({duration:1000});
  }, []);




  return (
    <div className="h-[50vh] px-16 flex flex-col mt-32">

      
    
      <div className="grid grid-cols-2 justify-center items-center gap-8">

          <div className="flex flex-col justify-center items-center relative">
              <img src="/cube.png" className="w-[70%] object-cover"></img>


          </div>

          <div className="flex flex-col justify-center items-center -ml-32">
              <h1 className="text-4xl font-medium mb-8"> THIS IS <span className="text-gradient-orange font-extrabold" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"> CVITX</span></h1>
              <p className="text-sm font-light text-left w-[60%] mb-4">CVITX is an AI-powered, web-based analytics platform that transforms raw surveillance footage into a centralized vehicle intelligence database. It extracts and organizes each detected vehicle by type, make, model, and license plate—complete with timestamps and location metadata. </p>
              <p className="text-sm font-light text-left w-[60%] mb-4">The platform provides an intuitive interface that empowers efficient searching, filtering, and narrowing down searches and investigations. The index records can be compiled into an interactive timeline, together with AI-powered Technical Report Writer integration to accelerate investigative workflows.  </p>
              <p className="text-sm font-light text-left w-[60%]">Through CVITX, stakeholders access on-demand, comprehensive, and next-generation vehicle analytics, driving enhanced surveillance operations and informed strategic decision-making.</p>
          </div>




      </div>

      
    </div>
  )
}

export default Intro