// Vehicle Types
export const vehicleTypes = ["Car", "SUV", "PickUp", "Van", "Utility", "Light Truck", 
  "Jeepney", "Truck", "Bus", "Motorcycle", "Bicycle", "E-Bike", "Pedicab", 
  "Tricycle", "E-Jeepney", "Carousel Bus", "Container Truck", "Special Vehicle", "UNCATEGORIZED"
];

// Vehicle Colors
export const vehicleColors = [
  "White", "Black", "Gray", "Silver", "Red", "Blue", "Green", "Yellow", 
  "Light Gray", "Dark Gray", "Light Blue", "Dark Blue", 
  "Yellow Green", "Orange", "Maroon", "Brown", "UNCATEGORIZED"
];

// Array of all vehicle makes (brand/manufacturer)
const vehicleMakes = [
  "Toyota", "Mitsubishi", "Ford", "Nissan", "Honda", 
  "Suzuki", "Hyundai", "Isuzu", "Geely", "Chevrolet", "Yamaha", "UNCATEGORIZED"
];

// Common models for cars
const vehicleCarModels = [
  "Wigo", "Vios", "Corolla Altis", "Camry", "GR Yaris", "Mirage", "Mirage G4", "Mustang",
  "Almera", "GT-R", "Brio", "City", "Civic", "Civic Type R", "Dzire", "Elantra", "Emgrand", 
  "Camaro", "UNCATEGORIZED"
];

// Common models for suv's
const vehicleSUVModels = [
  "Raize", "Yaris Cross", "Corolla Cross", "Rush", "Fortuner", "Land Cruiser Prado", 
  "Land Cruiser LC300", "Avanza", "Veloz", "Innova", "Xpander", "Montero Sport", "Xpander", 
  "Montero Sport", "Everest", "Territory", "Explorer", "Terra", "Patrol", "BR-V", "CR-V", "HR-V", 
  "Jimny", "Ertiga", "Stargazer", "Tucson", "Santa Fe", "mu-X", "Coolray", "GX3 Pro", "Okavango", 
  "Trailblazer", "Suburban", "UNCATEGORIZED"
];

// Common models for vans
const vehicleVanModels = [
  "Alphard", "Coaster", "HiAce", "UNCATEGORIZED"
];

// Common models for pickups
const vehiclePickupModels = [
  "Hilux", "Hilux Tamaraw", "Strada", "Triton", "Ranger Wildtrak", "Ranger Raptor", "Navara", "D-Max", "UNCATEGORIZED"
];

// Common models for utility
const vehicleUtilityModels = [
  "Lite Ace", "L300", "Urvan", "Staria", "H-100", "Traviz", "UNCATEGORIZED"
];

// Common models for motorcycles
const vehicleMotorcycleModels = [
  "BeAT 110", "Click Series", "PCX160", "Wave RSX", "TMX 125", "XRM 125", "Mio Series", "NMAX Series",
  "Aerox 155", "Raider R150 Fi", "Smash 115 Fi", "Burgman Street 125", "UNCATEGORIZED"
];



// Global combined arrays for dropdown use
export const allVehicleModels = [
  ...vehicleCarModels,
  ...vehicleSUVModels,
  ...vehicleVanModels,
  ...vehiclePickupModels,
  ...vehicleUtilityModels,
  ...vehicleMotorcycleModels,
];

export const allVehicleMakes = [...vehicleMakes]; // already a flat array
