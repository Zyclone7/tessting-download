'use client'

import { useEffect } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const images = [
  "/images/c1.png",
  "/images/c2.png",
  "/images/c3.jpg",
  "/images/c4.jpg",
];

// export function EmblaCarousel() {
//   const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Autoplay()]);
//   const images = [
//     "/images/c1.png",
//     "/images/c2.png",
//     "/images/c3.jpg",
//     "/images/c4.jpg",
//   ];

//   useEffect(() => {
//     if (emblaApi) {
//       // Embla API is ready
//     }
//   }, [emblaApi]);

//   return (
//     <div className="relative">
//       <div className="overflow-hidden" ref={emblaRef}>
//         <div className="flex space-x-4">
//           {images.map((src, index) => (
//             <div
//               key={index}
//               className="flex-[0_0_100%] min-w-0 relative h-[15rem]"
//             >
//               <Image
//                 src={src || "/placeholder.svg"}
//                 alt={`Carousel image ${index + 1}`}
//                 fill
//                 style={{ objectFit: "cover" }}
//                 className="opacity-80 bg-black rounded-lg"
//               />
//               <div className="absolute inset-0 bg-black opacity-5"></div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

export function CarouselDemo() {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full max-w-6xl" // Adjust max width as needed
    >
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3"> {/* Adjust responsive basis */}
            <div className="p-2"> {/* Adjust padding between cards */}
              <Card className="overflow-hidden">
                <CardContent className="relative flex aspect-video items-center justify-center p-0">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Carousel image ${index + 1}`}
                    width={600}
                    height={400}
                    style={{ objectFit: "cover" }}
                    className="opacity-80 bg-black"
                  />
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  {/* Optional content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/60">
                    <h3 className="text-lg font-semibold">Card Title {index + 1}</h3>
                    <p className="text-sm">Description or details</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
