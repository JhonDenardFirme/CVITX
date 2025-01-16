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
    <div className="px-32 grid grid-cols-4 gap-32 h-18 mt-16">
      <div className="flex flex-col w-full justify-center items-center"         
        data-aos="fade-up" // Using custom AOS trigger name
        data-aos-duration="1000"
        data-aos-delay="100"
        data-aos-offset="50"
        
        >
        <p className="num-text">10M+</p>
        <p className="desc-text">CODE WRITTEN</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center "
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="250"
              data-aos-offset="50">
        <p className="num-text">300K+</p>
        <p className="desc-text">ACTIVE DEVELOPERS</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center "
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="400"
              data-aos-offset="50">
        <p className="num-text">100+</p>
        <p className="desc-text">PARTNER CLIENTS</p>
      </div>

      <div className="flex flex-col w-full justify-center items-center"
              data-aos="fade-up" // Using custom AOS trigger name
              data-aos-duration="1000"
              data-aos-delay="550"
              data-aos-offset="50">
        <p className="num-text">200+</p>
        <p className="desc-text">PLATFORMS</p>
      </div>


    </div>
  )
}

export default Stats