import Image from "next/image"

interface RestaurantCardProps {
  name: string
  image: string
  description: string
}

export default function RestaurantCard({ name, image, description }: RestaurantCardProps) {
  return (
    <div className="min-w-[300px] max-w-[300px] bg-white rounded-lg overflow-hidden shadow-sm border-[0.1px] border-gray-200/30 flex-shrink-0 mx-2">
      <div className="p-3 border-b border-gray-100/20">
        <h3 className="font-medium text-lg">{name}</h3>
      </div>
      <div className="relative h-[180px] w-full">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
