const itemLiterals = [
    "Apple",
    "Avocado",
    "Banana",
    "Beef",
    "Blueberry",
    "Chicken",
    "CocoaBean",
    "CoffeeBean",
    "Egg",
    "Fish",
    "Flour",
    "Grapes",
    "Ice",
    "Mango",
    "Milk",
    "Oil",
    "Orange",
    "Pineapple",
    "Pork",
    "Rice",
    "Strawberry",
    "Sugar",
    "Water",
    "Yogurt"
];



export function ItemLiteralChecker(value){

    if (itemLiterals.includes(value)) {
        // If it is a valid color literal, return a token object
        return true;
    }
    else {return false};
    
}