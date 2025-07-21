'use client';


import { useEffect } from "react"

// aos

import AOS from 'aos';
import 'aos/dist/aos.css';

const Stats = () => {

  useEffect(() => {
    AOS.init({ duration: 1000, delay: 0 });
  }, []);

  return (
    <div className="px-32 grid grid-cols-4 gap-32 h-18 mt-16 z-50">
      <div className="flex flex-col w-full justify-center items-center"         
        data-aos="fade-up" // Using custom AOS trigger name
        data-aos-duration="1000"
        data-aos-delay="100"
        data-aos-offset="50"
        
        >
        <p className="num-text">500K+</p>
        <p className="desc-text">VEHICLES INDEXED</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center "
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="250"
              data-aos-offset="50">
        <p className="num-text">1K+</p>
        <p className="desc-text">INVESTIGATIONS SUPPORTED</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center "
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="400"
              data-aos-offset="50">
        <p className="num-text">5K+</p>
        <p className="desc-text">AI REPORTS GENERATED</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center"
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="550"
              data-aos-offset="50">
        <p className="num-text">10K+</p>
        <p className="desc-text">FOOTAGE HOURS ANALYZED</p>
      </div>


    </div>
  )
}

export default Stats