import Navbar from "./Navbar"

const Banner = () => {
    return (
        <div
            className="flex flex-col w-full h-[100vh] px-16 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/Banner.png')", // Replace with the correct image path
            }}
        >

            <Navbar></Navbar>

          <div className="flex flex-col justify-center items-center w-full p-16 mt-14">
            <img src="/Logo.png" className="h-52"></img>
            <img src="/BannerTitle.png" className="h-36"></img>
  
          </div>
  

  
          <div className="absolute blue-gradient w-[350px] h-[350px] z-10 -top-44 -right-16"></div>
          
          <div className="absolute lightblue-gradient w-[250px] h-[250px] z-10 -top-36 -right-16"></div>
        
          <div className="absolute orange-gradient w-[350px] h-[350px] z-10 -bottom-44 -left-52"></div>
          
          <div className="absolute light-orange-gradient w-[500px] h-[500px] z-10 -bottom-44 -left-52"></div>
  
      </div>
    )
  }
  
  export default Banner