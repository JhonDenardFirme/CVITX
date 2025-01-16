const recipeLiterals = [
    "CocoaPowder", "BoiledEgg", "AppleJam", "GroundCoffee",
    "FriedRice", "AvocadoJam", "HotMilk", "ScrambledEgg",
    "BananaJam", "HotWater", "SunnySideUp", "BlueberryJam",
    "SunnySideUp", "GrapesJam", "Bread", "MangoJam",
    "FriedBangus", "MarmaladeJam", "FriedChicken", "PineappleJam",
    "FriedPorkchop", "StrawberryJam", "Tapa", "AppleJamSandwich",
    "Bangsilog", "AvocadoJamSandwich", "Chicksilog", "BananaJamSandwich",
    "Porksilog", "BlueberryJamSandwich", "Tapsilog", "GrapesJamSandwich",
    "FriedPorkchop", "MangoJamSandwich", "Tapa", "MarmaladeJamSandwich",
    "Espresso", "PineappleJamSandwich", "HotChoco", "StrawberryJamSandwich",
    "HotChocoMilk", "AppleJuice", "HotLatte", "AvocadoJuice",
    "HotMocha", "BananaJuice", "IcedChoco", "BlueberryJuice",
    "IcedCoffee", "GrapesJuice", "IcedLatte", "OrangeJuice",
    "IcedMocha", "PineappleJuice", "IcedWater", "StrawberryJuice",
    "AppleSmoothie", "AvocadoSmoothie", "BananaSmoothie", "BlueberrySmoothie",
    "GrapesSmoothie", "MangoSmoothie", "OrangeSmoothie", "PineappleSmoothie",
    "StrawberrySmoothie"
];



export function RecipeLiteralChecker(value){

    if (recipeLiterals.includes(value)) {
        // If it is a valid color literal, return a token object
        return true;
    }
    else {return false};
    
}