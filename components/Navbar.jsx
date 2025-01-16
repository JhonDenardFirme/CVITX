import Link from "next/link"



const Navbar = async () => {

  return (
    <div className="w-full flex flex-row justify-between items-center px-16 h-[10vh] z-50">
        <Link className="h-20 w-auto flex justify-center items-center" href={'/'}>
          <img src="/logo.png" className="object-cover h-8 w-auto hover:scale-110 transition-all duration-300 ease-out"></img>
          <img src="/title.png" className="object-cover h-8 w-auto ml-2"></img>
        </Link>

        <div className="flex flex-row gap-16 justify-center ">
          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm" href={'/'}>
            Home
          </Link>

          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm" href={'/Documentation'}>
            Documentation
          </Link>

          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm" href={'/CodeEditor'}>
            Code Editor
          </Link>

          
        </div>





    </div>
  )
}

export default Navbar