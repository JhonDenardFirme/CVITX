
const Footer = () => {
  return (
    
    
    <section className="w-full grid grid-cols-5 p-16 justify-center items-start relative mt-8 -mb-8">
      

      <div className="flex flex-col justify-center items-start w-full col-span-2 ">
          <img src="Logo.png" className="h-16 ml-4"></img>
          <img src="BannerTitle.png" className="h-24 ml-4"></img>

          <div className=" p-2 pb-8 ml-1">
            <p className="text-xs text-white font:thin text-center">Copyright 2024 KiddoCode. All Rights Reserved.</p>
          </div>
      

        <div className="flex flex-row justify-start items-center gap-8 mt-8">
          <div className="h-4 w-auto">
            <img ></img>
          </div>
          <div className="h-4 w-auto">
            <img ></img>
          </div>
        </div>
        
      </div>

      <div className="flex flex-col justify-center items-start pl-8 pt-4 col-span-1">
        <p className="text-2xl text-gradient mb-8 font-bold">Links</p>
        
        <div className="flex flex-col justify-center items-start gap-4 " >
            <p className="text-sm text-white link">APIs</p>
            <p className="text-sm text-white link">FAQ</p>
            <p className="text-sm text-white link">Tutorials</p>
            <p className="text-sm text-white link">Release Notes</p>
          </div>
        
      </div>


      <div className="flex flex-col justify-center items-start pl-8 pt-4 col-span-1  ">
        <p className="text-2xl text-gradient mb-8 font-bold">Documentation</p>
        
          <div className="flex flex-col justify-center items-start gap-4 " >
            <p className="text-sm text-white link">APIs</p>
            <p className="text-sm text-white link">FAQ</p>
            <p className="text-sm text-white link">Tutorials</p>
            <p className="text-sm text-white link">Release Notes</p>
          </div>
        
      </div>


      <div className="flex flex-col justify-center items-start pl-8 pt-4 col-span-1 ">
        <p className="text-2xl text-gradient mb-8 font-bold">Partnerships</p>
        
          <div className="flex flex-col justify-center items-start gap-4 " >
            <p className="text-sm text-white link">Our Partners</p>
            <p className="text-sm text-white link">Be Our Partner</p>

          </div>
        
      </div>





    </section>

    
  )
}

export default Footer