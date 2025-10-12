'use client'


import Banner from "@/components/Banner";
import Stats from "@/components/Stats";
import Intro from "@/components/Intro";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function Home() {


  const handleSubmit = () => {

  }


  return (
    <div className="w-full h-auto bg-neutral-950 flex flex-col justify-center items-center">


    <Banner></Banner>
    <Stats></Stats>
    <Intro></Intro>
    <Features></Features>
    <Footer></Footer>
    </div>
  );
}
