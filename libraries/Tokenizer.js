
import { Categorize } from "./Categorizer";
import { ColorLiteralChecker } from "./LiteralChecker/ColorLiteralChecker";
import { EmotionLiteralChecker } from "./LiteralChecker/EmotionLiteralChecker";
import { ItemLiteralChecker } from "./LiteralChecker/ItemLiteralChecker";
import { RecipeLiteralChecker } from "./LiteralChecker/RecipeLiteralChecker";
import { ShapeLiteralChecker } from "./LiteralChecker/ShapeLiteralChecker";

export function tokenize(sourceCode) {
    const tokenTypes = [
       
        
        { type: 'KEYWORD', regex: /\b(fixed|check|opt|option|when|orwhen|otherwise|repeat|while|until|in|skip|stop|try|oops|lastly|task|send)\b/ }, 
        { type: 'RESERVED_WORD', regex: /\b(shared|secret|SIMPLIFY|WRAP|use)\b/ }, 
        { type: 'DATATYPE', regex: /\b(num|number|dec|decimal|symb|symbol|ans|answer|color|emo|emotion|shape|Word|Wording|item|Recipe)\b/ }, 
        { type: 'OOP_KW', regex: /\b(BLUEPRINT|BUILD|OUR|MY)\b/ }, 
        { type: 'IDENTIFIER', regex: /[a-zA-Z][a-zA-Z0-9_]*/ }, 
        { type: 'COMMENT', regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\// }, 

        { type: 'OPEN_BRACKET', regex: /\[/ },
        { type: 'CLOSE_BRACKET', regex: /\]/ },
        { type: 'OPEN_CURLY', regex: /\{/ },
        { type: 'CLOSE_CURLY', regex: /\}/ },
        { type: 'OPEN_PAREN', regex: /\(/ },
        { type: 'CLOSE_PAREN', regex: /\)/},        

        { type: 'INCREMENT', regex: /\+\+/ },
        { type: 'DECREMENT', regex: /\-\-/ },
        
        { type: 'COMPOUND_OP', regex: /(\+=|\-=|\*=|\/=|\%=)/},
        { type: 'ARITHMETIC_OP', regex: /[\*\/\%\+\-]/},

        { type: 'EQUALITY_OP', regex: /==|!=/},
        { type: 'NOT_OP', regex: /!/ },

        { type: 'LOGICAL_OP', regex: /&&|\|\|/},
        { type: 'RELATIONAL_OP', regex: />=|<=|>|</},
          
        { type: 'STAT_TERMINATOR', regex: /;/},
        { type: 'ASSIGNMENT', regex: /=/},  
        { type: 'COLON', regex: /:/},
        { type: 'QUESTION', regex: /\?/},
        { type: 'COMMA', regex: /,/},

        { type: 'DEC_LITERAL', regex: /\b\d+\.\d+\b/ }, 
        { type: 'NUM_LITERAL', regex: /\b\d+\b/ }, 

        { type: 'SYMBOL_LITERAL', regex: /(['"])[^'"]\1/ },
        { type: 'WORDING_LITERAL', regex: /"[^"]*"/ },

        { type: 'DOT_OP', regex: /\./},
        { type: 'WHITESPACE', regex: /\s+/ }, // Match whitespace
        

    ];

    const tokens = [];
    let currentPosition = 0;

    let hasShapeDataType = false;
    let hasColorDatatype = false;
    let hasEmotionDatatype = false;
    let hasItemDatatype = false;
    let hasRecipeDatatype = false;

    let hasAssignmentOp = false;


    
    while (currentPosition < sourceCode.length) {
        let matchFound = false;
        const remainingSource = sourceCode.slice(currentPosition);

        console.log(`Remaining source: "${remainingSource}" , LENGTH: ${sourceCode.length - currentPosition}`);

        for (let { type, regex } of tokenTypes) {
            const match = regex.exec(remainingSource);

            if (match && match.index === 0) {
                const value = match[0];

                if (type !== 'WHITESPACE') {
                    
                    let token = { type, value };
                    token = Categorize([token])[0];
                    tokens.push(token);


                    if (type === 'DATATYPE') {
                        
                        if (value === 'shape') hasShapeDataType = true;
                        if (value === 'color') hasColorDatatype = true;
                        if (value === 'emo' || value === 'emotion') hasEmotionDatatype = true;
                        if (value === 'item') hasItemDatatype = true;
                        if (value === 'Recipe') hasRecipeDatatype = true;

                    }

                    if (type === 'ASSIGNMENT') hasAssignmentOp = true;

                    // Invoke LiteralChecker and pass all relevant data
                    LiteralChecker(value, token, tokens, hasAssignmentOp, hasShapeDataType, hasColorDatatype, hasEmotionDatatype, hasItemDatatype, hasRecipeDatatype);

                }

                
                currentPosition += value.length;
                matchFound = true;
                
                break; 
            }
        }

        if (!matchFound) {
            console.log(`No match found at position ${currentPosition}: ${sourceCode[currentPosition]}`);
            throw new Error(`Unexpected Character at position ${currentPosition}: ${sourceCode[currentPosition]}`);
        }
    }

    console.log(tokens);

    return tokens; 

}





function LiteralChecker(value, token, tokens, hasAssignmentOp, hasShapeDataType, hasColorDatatype, hasEmotionDatatype, hasItemDatatype, hasRecipeDatatype){
    
    
    if (hasAssignmentOp && hasShapeDataType) {
        if (ShapeLiteralChecker(value)) {
            // If valid Shape Literal, create the New Token
            token = { type: 'SHAPE_LITERAL', value }; 
            tokens.pop();  // Remove Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasColorDatatype) {
        if (ColorLiteralChecker(value)) {
            // If valid Color Literal, create the New Token
            token = { type: 'COLOR_LITERAL', value }; 
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }


    if (hasAssignmentOp && hasEmotionDatatype) {
        if (EmotionLiteralChecker(value)) {
            // If valid Emotion Literal, create the New Token
            token = { type: 'EMOTION_LITERAL', value }; 
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasItemDatatype) {
        if (ItemLiteralChecker(value)) {
            // If valid Item Literal, create the New Token
            token = { type: 'ITEM_LITERAL', value }; 
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasRecipeDatatype) {
        if (RecipeLiteralChecker(value)) {
            // If valid Recipe Literal, create the New Token
            token = { type: 'RECIPE_LITERAL', value }; 
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }
}