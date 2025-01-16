const colorLiterals = [
    "Red", "Pink", "Burgundy", "Maroon", "Yellow", "LightYellow", "Mustard", "Cinnamon", 
    "Blue", "SkyBlue", "NavyBlue", "SlateBlue", "Orange", "Peach", "BurntOrange", "Copper", 
    "Green", "Mint", "ForestGreen", "Moss", "Violet", "Lavender", "DeepViolet", "Mauve", 
    "White", "Gray", "Beige", "Black", "Ebony", "Brown", "RedOrange", "Apricot", "Rust", 
    "Mahogany", "YellowOrange", "Pumpkin", "Maple", "YellowGreen", "Lime", "Olive", "Pistachio", 
    "BlueGreen", "Aqua", "Teal", "TealWood", "Indigo", "Lilac", "MidnightBlue", "Sangria", 
    "RedViolet", "Orchid", "Plum", "PlumWood", "Ash", "Charcoal", "Stone", "Khaki", "ShadowBeige", 
    "Tan", "PaleEbony", "DarkEbony", "Chestnut"
  ];


export function ColorLiteralChecker(value){

    if (colorLiterals.includes(value)) {
        // If it is a valid color literal, return a token object
        return true;
    }
    else {return false};
    
}