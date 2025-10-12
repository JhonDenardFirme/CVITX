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
          <img src="Logo.png" className="h-64"></img>
          <img src="BannerTitle.png" className="h-52"></img>
        </div>

        <div className="flex flex-col justify-center items-start px-64 mb-32">
              <h1 className="text-4xl font-medium mb-8"> <span className="text-gradient-blue font-extrabold" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"> CVITX</span></h1>
              <p className="text-md font-light text-left">CVITX is an AI-powered, web-based analytics platform that transforms hours of raw surveillance footage into a centralized, searchable vehicle intelligence repository. By extracting and structuring fine-grained attributes—vehicle type, make, model, license plate, timestamps and location metadata—CVITX enables on-demand search, multi-criteria filtering and interactive timeline assembly, accelerating traffic-violation tracing, security investigations and fleet monitoring. An integrated AI Technical Report Writer then automatically compiles detection summaries and visual timelines into publication-quality reports, empowering authorities and security teams to drive proactive surveillance operations and data-driven decision-making.
            </p>
              
        </div>

        <div className="flex flex-col justify-center items-start px-64 ">
              <h1 className="text-4xl font-medium mb-8"> <span className="text-gradient-blue font-extrabold" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"> OVERVIEW OF THE PROJECT</span></h1>
              <h1 className="text-xl font-medium mb-4"> THESIS DEVELOPMENT CONTEXT</h1>

              <p className="text-md font-light text-left">Developed by Polytechnic University students under the thesis “Compositional Masking Training for Part-Aware MobileViT in Advancing Fine-Grained Vehicle Make-Model Recognition (VMMR) Indexing Systems,” CVITX addresses the persistent manual effort required to trace vehicles across disparate CCTV feeds. Through interviews with barangay halls, municipal offices and the PNP Highway Patrol Group, the team identified a critical need to replace laborious frame-by-frame review with automated indexing. Leveraging a novel Part-Aware MobileViT backbone trained via Compositional Masking Training (CMT), the project automates the detection, classification and indexing of every vehicle snapshot—dramatically reducing investigative lead times and delivering a practical, scalable solution for real-world surveillance challenges.
            </p>


            <h1 className="text-xl font-medium mb-4 mt-12"> COMPREHENSIVE VEHICLE ATTRIBUTE INDEXING</h1>

            <p className="text-md font-light text-left">
                CVITX automatically processes uploaded surveillance footage to detect every passing vehicle, cropping snapshots and extracting fine-grained attributes including vehicle type, manufacturer (make), specific variant (model), and license-plate imagery. Optical Character Recognition (OCR) is applied to readable plates, enabling unique identification and cross-camera tracking. Each entry is annotated with precise timestamps, camera location metadata, and detection confidence scores, then stored in a centralized database—providing investigators with a structured, searchable repository that replaces manual logbooks with automated, reliable indexing.
            </p>


            <h1 className="text-xl font-medium mb-4 mt-12">ADVANCED SEARCH, FILTERING, & TIMELINE</h1>

            <p className="text-md font-light text-left">
                Investigators interact with CVITX through an intuitive web interface that supports multi-criteria search and dynamic filtering—allowing users to pinpoint vehicles by type, color, make/model, plate number, date range, or camera source. Matched results can be compiled into interactive timelines, visually mapping vehicle movements across disparate CCTV feeds. This feature not only accelerates the identification of violators and suspects but also generates a clear, chronological narrative of their whereabouts, reducing investigative lead times from hours to minutes.
            </p>

            <h1 className="text-xl font-medium mb-4 mt-12">TECHNICAL DETAILS & ARCHITECTURE</h1>

            <p className="text-md font-light text-left">
                At the heart of CVITX lies a Part-Aware MobileViT architecture enhanced through the proposed Compositional Masking Training (CMT), a two-fold masking strategy that progressively and contextually occludes vehicle parts during training. This approach forces the model to learn the compositional relationships among headlights, grilles, wheels, and other discriminative features, dramatically improving recognition accuracy under real-world occlusion and multi-angle scenarios. By leveraging a proposed Currilulum Learning Framework, the thesis demonstrates measurable gains in mAP@50, IoU, and robustness metrics—ensuring that CVITX maintains high performance when deployed on complex CCTV video streams.
            </p>

            <h1 className="text-xl font-medium mb-4 mt-12">SCALABLE WEB-BASED DEPLOYMENT</h1>

            <p className="text-md font-light text-left">
                Designed for maximum accessibility, CVITX operates entirely as a pre-processing web application, requiring no specialized hardware on the client side. Footage upload, vehicle detection (via YOLOv8+DeepSORT), part-aware classification, and OCR are orchestrated on cloud servers optimized for batch processing. Temporary database storage safeguards investigative privacy while offering options to export or purge data post-case. By decoupling computational load from end-user devices, our platform delivers enterprise-grade analytics to police precincts, barangay halls, and traffic agencies with minimal IT overhead.
            </p>


            <h1 className="text-xl font-medium mb-4 mt-12">LIMITATIONS AND FUTURE DIRECTIONS</h1>

            <p className="text-md font-light text-left">
                While CVITX pushes the frontier of automated VMMR indexing, it acknowledges challenges in low-resolution footage, extreme occlusions, and illegible plates, which may yield partial or coarse-grained detections. To mitigate misclassification risks, the model applies confidence thresholds that default to broader vehicle-type labels when certainty is low. Future work will explore enhanced OCR pipelines, multi-camera fusion techniques, and real-time streaming integration—ensuring CVITX evolves alongside emerging surveillance technologies and continues to meet the rigorous demands of field investigators.
            </p>
              
        </div>

        <Link className="hover:scale-110 transition-all duration-300 ease-out text-sm" href="#">
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
  
