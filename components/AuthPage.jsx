import Link from "next/link";
import Navbar from "./Navbar";
import { useRouter } from 'next/navigation' 

const AuthPage = () => {

    const router = useRouter();

    const handleSubmit = (e) => {
    e.preventDefault()
    router.push('/dashboard');
  }


  return (
    <div className="grid grid-cols-5 w-full h-screen overflow-hidden">
      
      {/* Main Section - 3 Columns */}
      <div
        className="col-span-3 flex flex-col w-full h-[100vh] px-16 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: "url('/Banner.png')",
        }}
      >
        <Navbar />

        <div className="flex flex-col justify-center items-center w-full p-16 mt-14 z-10">
          <img src="/Logo.png" className="h-52" />
          <img src="/BannerTitle.png" className="h-36" />
        </div>

        {/* Gradient Decorations */}

      </div>

      
      <div className="col-span-2 flex justify-center items-center ">
        <form className="w-96 flex flex-col gap-6" onSubmit={handleSubmit}>
          
          {/* Header */}
          <div className="text-center">
            <p className="text-4xl font-bold text-white">Sign-In</p>
            <p className="text-xs text-gray-300 mt-1">Please enter your credentials</p>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-white">Email</label>
            <input
              type="email"
              id="email"
              className="p-3 rounded-md bg-gray-800 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm text-white">Password</label>
            <input
              type="password"
              id="password"
              className="p-3 rounded-md bg-gray-800 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition"
          >
            Sign In
          </button>

          <div className="w-full flex flex-row justify-center items-center gap-4">
            <div className="w-full h-[1px] bg-gray-700"></div>
            <p className="text-xs text-gray-600">OR</p>
            <div className="w-full h-[1px] bg-gray-700"></div>
          </div>

          <Link href="/" className="block w-full text-center border border-orange-500 hover:bg-orange-500 text-white py-3 rounded-md transition">
              Request an Account
          </Link>

          

        </form>

        

      </div>

        <div className="absolute blue-gradient w-[350px] h-[350px] -top-44 -right-16 z-0"></div>
        <div className="absolute lightblue-gradient w-[250px] h-[250px] -top-36 -right-16 z-0"></div>
        <div className="absolute orange-gradient w-[350px] h-[350px] -bottom-44 -left-52 z-0"></div>
        <div className="absolute light-orange-gradient w-[500px] h-[500px] -bottom-44 -left-52 z-0"></div>
      
    </div>
  );
};

export default AuthPage;
