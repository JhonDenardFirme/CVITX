import Link from "next/link";
import Navbar from "./Navbar";

const RequestPage = () => {
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

        

      </div>

        <div className="col-span-2 flex flex-col items-center min-h-[100vh] overflow-y-auto py-32">
          <form className="w-96 flex flex-col gap-6">

            <div className="text-center">
              <p className="text-4xl font-bold text-white">Request an Account</p>
              <p className="text-xs text-gray-300 mt-1">Please provide your details</p>
            </div>

          <div className="w-full flex flex-row justify-center items-center gap-4 mt-8">
            <div className="w-full h-[1px] bg-gray-700"></div>
            <p className="text-xs text-gray-600 whitespace-nowrap">PERSONAL DETAILS</p>
            <div className="w-full h-[1px] bg-gray-700"></div>
          </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm text-white">First Name</label>
              <input
                type="text"
                id="firstName"
                placeholder="First Name"
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            
            <div className="flex flex-col gap-2">
              <label htmlFor="middleInitial" className="text-sm text-white">Middle Initial</label>
              <input
                type="text"
                id="middleInitial"
                placeholder="Middle Initial"
                maxLength={1}
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            
            <div className="flex flex-col gap-2">
              <label htmlFor="surname" className="text-sm text-white">Surname</label>
              <input
                type="text"
                id="surname"
                placeholder="Surname"
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>


            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm text-white">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g., juandelacruz@email.com"
                required
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>



          <div className="w-full flex flex-row justify-center items-center gap-4 mt-8">
            <div className="w-full h-[1px] bg-gray-700"></div>
            <p className="text-xs text-gray-600">AFFILIATION</p>
            <div className="w-full h-[1px] bg-gray-700"></div>
          </div>

            {/* Institution */}
            <div className="flex flex-col gap-2">
              <label htmlFor="institution" className="text-sm text-white">Institution</label>
              <input
                type="text"
                id="institution"
                placeholder="ex. Philippine National Police"
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

                       
            <div className="flex flex-col gap-2">
              <label htmlFor="institution" className="text-sm text-white">Role</label>
              <input
                type="text"
                id="institution"
                placeholder="ex. SPO1 Police Investigator"
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            
            <div className="flex flex-col gap-2">
              <label htmlFor="purpose" className="text-sm text-white">Purpose of Use</label>
              <select
                id="purpose"
                name="purpose"
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue=""
              >
                <option value="" disabled>Select a purpose</option>
                <option value="Academic">Academic Purposes</option>
                <option value="Administrative">Administrative Purposes</option>
                <option value="Investigation">Investigation Purposes</option>
                <option value="Others">Others</option>
              </select>
            </div>


            {/* Submit */}
            <button
              type="submit"
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition"
            >
              Submit Request
            </button>

          <div className="w-full flex flex-row justify-center items-center gap-4 mt-8">
            <div className="w-full h-[1px] bg-gray-700"></div>
            <p className="text-xs text-gray-600">OR</p>
            <div className="w-full h-[1px] bg-gray-700"></div>
          </div>

            {/* Back to Sign In */}
            <Link
              href="/auth-signin"
              className="block w-full text-center border border-orange-500 hover:bg-orange-500 text-white py-3 rounded-md transition mb-32"
            >
              Back to Sign In
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

export default RequestPage;
