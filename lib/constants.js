// Vehicle Types
export const vehicleTypes = [
  "Car", "SUV", "Van", "Pickup", "Utility",
  "Motorcycle", "Bicycle", "E-Bike", "Pedicab", "Tricycle",
  "Jeepney", "E-Jeepney", "Bus", "CarouselBus", "LightTruck",
  "ContainerTruck", "SpecialVehicle", "-"
];

// Vehicle Colors
export const vehicleColors = [
  // Base colors (model-facing)
  "Red","Orange","Yellow","Green","Blue","Purple","Pink",
  "White","Gray","Black","Silver","Gold","Brown","Beige","Maroon","Cyan",
  // Finish and Lightness tokens (no combinations, listed as-is)
  "Metallic","Matte","Glossy","Light","Dark",
  "-"
];

// Array of all vehicle makes (brand/manufacturer)
const vehicleMakes = [
  "Toyota","Mitsubishi","Ford","Nissan","Honda",
  "Suzuki","Hyundai","Isuzu","Geely","Chevrolet",
  "HondaMC","YamahaMC","SuzukiMC",
  "-"
];

// Common models for cars
const vehicleCarModels = [
  "Wigo","Vios","CorollaAltis","Camry","GRYaris",
  "Mirage","MirageG4","Mustang",
  "Almera","GT-R",
  "Brio","City","Civic","CivicTypeR",
  "Dzire","Elantra","Emgrand","Camaro",
  "-"
];

// Common models for SUVs
const vehicleSUVModels = [
  "Raize","YarisCross","CorollaCross","Rush","Fortuner",
  "LandCruiserPrado","LandCruiserLC300","Avanza","Veloz","Innova",
  "Xpander","MonteroSport",
  "Everest","Territory","Explorer",
  "Terra","Patrol",
  "BR-V","CR-V","HR-V",
  "Jimny","Ertiga",
  "Stargazer","Tucson","SantaFe",
  "Mu-X",
  "Coolray","GX3Pro","Okavango",
  "Trailblazer","Suburban",
  "-"
];

// Common models for vans
const vehicleVanModels = [
  "Alphard","Coaster","HiAce",
  "Staria","Urvan",
  "-"
];

// Common models for pickups
const vehiclePickupModels = [
  "Hilux","HiluxTamaraw",
  "Strada","Triton",
  "RangerWildtrak","RangerRaptor",
  "Navara","D-Max",
  "-"
];

// Common models for utility
const vehicleUtilityModels = [
  "LiteAce","L300","H-100","Traviz",
  "-"
];

// Common models for motorcycles
const vehicleMotorcycleModels = [
  // HondaMC
  "BeAT","Click","PCX","WaveRSX","TMX","XRM",
  // YamahaMC
  "Mio","NMAX","Aerox",
  // SuzukiMC
  "Raider","Smash","BurgmanStreet",
  "-"
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
