import Link from "next/link"



const Navbar = () => {

  return (
    <div className="w-full flex flex-row justify-between items-center px-16 h-[10vh] z-50">
        <Link className="h-20 w-auto flex justify-center items-center" href={'/'}>
          <img src="/Logo.png" className="object-cover h-8 w-auto hover:scale-110 transition-all duration-300 ease-out"></img>
          <img src="/Title.png" className="object-cover h-8 w-auto ml-2"></img>
        </Link>

        <div className="flex flex-row gap-16 justify-center ">
          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm text-white" href={'/'}>
            Home
          </Link>

          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm text-white" href={'/Documentation'}>
            Documentation
          </Link>

          <Link className="hover:scale-110 hover:text-[#2dc1d6] transition-all duration-300 ease-out text-sm text-white" href={'/auth-signin'}>
            Sign In
          </Link>

          
        </div>





    </div>
  )
}

export default Navbar