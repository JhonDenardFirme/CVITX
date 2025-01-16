const shapeLiterals = [
    "Circle", 
    "Point", 
    "Line", 
    "Triangle", 
    "Quadrilateral", 
    "Pentagon", 
    "Hexagon", 
    "Heptagon", 
    "Octagon", 
    "Nonagon", 
    "Decagon", 
    "Hendecagon", 
    "Dodecagon", 
    "ComplexPolygon"
];



export function ShapeLiteralChecker(value){

    if (shapeLiterals.includes(value)) {
        // If it is a valid color literal, return a token object
        return true;
    }
    else {return false};
    
}