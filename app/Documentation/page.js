import Navbar from "@/components/Navbar";
import Link from "next/link";

const Documentation = () => {
    return (
      <div
        className="relative w-full min-h-[100vh] px-16 pb-16 bg-cover bg-center bg-no-repeat bg-fixed overflow-auto"
        style={{
          backgroundImage: "url('/Banner.png')", // Replace with the correct image path
        }}
      >
        <Navbar></Navbar>
        <div className="flex flex-col justify-center items-center w-full p-16">
          <img src="logo.png" className="h-64"></img>
          <img src="BannerTitle.png" className="h-52"></img>
        </div>

        <div className="flex flex-col justify-center items-start px-64 mb-32">
              <h1 className="text-4xl font-medium mb-8"> <span className="text-gradient-blue font-extrabold" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"> KIDDOCODE</span></h1>
              <p className="text-lg font-light text-left">KiddoCode is a child-friendly programming language intended to initiate kids, 
                students, and the young-at-heart into the programming world. By reducing the 
                possibility of syntax errors by creating a whole new way of programming 
                environments, kids can better understand simple programming concepts. This 
                programming language brings stimulating and creative ideas to the table that keeps 
                learning fun and engaging for its intended users. It also fosters the development of 
                critical thinking and problem-solving skills, which can be applied in a variety of 
                academic fields. In the long term, this language prepares children for possible 
                success in the vast digital world of the future by encouraging early interest in 
                technology and improving digital knowledge.
            </p>
              
        </div>

        <div className="flex flex-col justify-center items-start px-64 ">
              <h1 className="text-4xl font-medium mb-8"> <span className="text-gradient-blue font-extrabold" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"> PRINCIPLES OF THE LANGUAGE</span></h1>
              <h1 className="text-xl font-medium mb-4"> A LANGUAGE IN BABY MODE</h1>

              <p className="text-lg font-light text-left">KiddoCode is a child-friendly programming language intended to initiate kids, 
                students, and the young-at-heart into the programming world. By reducing the 
                possibility of syntax errors by creating a whole new way of programming 
                environments, kids can better understand simple programming concepts. This 
                programming language brings stimulating and creative ideas to the table that keeps 
                learning fun and engaging for its intended users. It also fosters the development of 
                critical thinking and problem-solving skills, which can be applied in a variety of 
                academic fields. In the long term, this language prepares children for possible 
                success in the vast digital world of the future by encouraging early interest in 
                technology and improving digital knowledge.
            </p>


            <h1 className="text-xl font-medium mb-4 mt-12"> SIMPLIFIED AS A STARTER LANGUAGE</h1>

            <p className="text-lg font-light text-left">
                Being an introductory programming language, the foundation of KiddoCode was 
                established on the Java Programming Language. The language introduces distinct 
                data types and focuses more on easy-to-read syntax, especially in control flow and 
                looping statements. Simplified functions are used through the declaration of tasks, 
                making it much easier for beginners to pick up and use. The language introduces 
                basic concepts such as variables, control, and loop statements in a manner that is 
                easy to comprehend by the users.
                This simplified syntax will make the language more readable, allowing 
                KiddoCoders to better focus on learning the logic and structure of programming 
                rather than constantly worrying over complex syntax. Thus, it bridges the learning 
                curve of complex languages and equips learners with a solid understanding of the 
                programming fundamentals, promoting continuous learning that will prove 
                advantageous when they finally decide to pursue programming-related careers.
            </p>


              <h1 className="text-xl font-medium mb-4 mt-12">A FUNCTIONAL PL WITH BASIC OOP</h1>

              <p className="text-lg font-light text-left">
                In KiddoCode, unlike Java programming language that requires a main class 
                to run the whole program, this programming language only requires a method or 
                method task. It is because being a functional programming language, it only focuses 
                on a main method or main task declaration to establish a valid program structure. 
                The core principles and paradigms of KiddoCode revolve around the creation and 
                invocation of functions and expressions to accomplish desired tasks and commands
                Moreover, to preserve the basics of Object-Oriented-Programming (OOP), 
                KiddoCoders can create classes and objects inside the method or method tasks. By 
                prioritizing functions and expressions, KiddoCode introduces the foundational 
                programming concepts in an accessible and engaging way to foster creativity and 
                logical thinking among its intended users
            </p>
              
        </div>

        <Link className="hover:scale-110 transition-all duration-300 ease-out text-sm" href={"https://drive.google.com/file/d/1WTj7eH0ZqcDR4NdZd_cXVtp4MR2kURpt/view?usp=sharing"}>
            <div className="border-[1px] border-neutral-800  rounded-lg h-24 p-4 flex justify-center items-center mx-64 gap-2 mt-12 hover:bg-teal-950 hover:cursor-pointer">
                                <img src='document.svg' className='h-6'></img>
                                <p className='text-sm text-[#00C0D3]'>GET THE FULL DOCUMENTATION</p>

            </div>
        </Link>

  
        
        <div className="fixed blue-gradient w-[350px] h-[350px] z-10 -top-44 -right-16"></div>
        <div className="fixed lightblue-gradient w-[250px] h-[250px] z-10 -top-36 -right-16"></div>
        <div className="fixed orange-gradient w-[350px] h-[350px] z-10 -bottom-44 -left-52"></div>
        <div className="fixed light-orange-gradient w-[500px] h-[500px] z-10 -bottom-44 -left-52"></div>
      </div>
    );
  };
  
  export default Documentation;
  
