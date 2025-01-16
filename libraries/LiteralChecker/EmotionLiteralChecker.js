const emotionLiterals = [
    "Joy", 
    "Sadness", 
    "Disgust", 
    "Fear", 
    "Anger", 
    "Anxiety", 
    "Ecstasy", 
    "Melancholy", 
    "Intrigue", 
    "Surprise", 
    "Righteousness", 
    "Despair", 
    "SelfLoathing", 
    "Betrayal", 
    "Prejudice", 
    "Revulsion", 
    "Loathing", 
    "Terror", 
    "Hatred", 
    "Rage"
];




export function EmotionLiteralChecker(value){

    if (emotionLiterals.includes(value)) {
        // If it is a valid color literal, return a token object
        return true;
    }
    else {return false};
    
}