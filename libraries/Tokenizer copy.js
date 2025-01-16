import { Categorize } from "./Categorizer";
import { ColorLiteralChecker } from "./LiteralChecker/ColorLiteralChecker";
import { EmotionLiteralChecker } from "./LiteralChecker/EmotionLiteralChecker";
import { ItemLiteralChecker } from "./LiteralChecker/ItemLiteralChecker";
import { RecipeLiteralChecker } from "./LiteralChecker/RecipeLiteralChecker";
import { ShapeLiteralChecker } from "./LiteralChecker/ShapeLiteralChecker";

export function tokenize(sourceCode) {
    const tokenTypes = [
       
        { type: 'KEYWORD', regex: /\b(fixed|check|opt|option|when|orwhen|otherwise|repeat|while|until|in|skip|stop|try|oops|lastly|task|send)\b/ }, // Match keywords with boundaries
        { type: 'RESERVED_WORD', regex: /\b(shared|secret|SIMPLIFY|WRAP|use)\b/ }, 
        { type: 'DATATYPE', regex: /\b(num|number|dec|decimal|symb|symbol|ans|answer|color|emo|emotion|shape|Word|Wording|item|Recipe)\b/ }, // Match data types with boundaries
        { type: 'OOP_KW', regex: /\b(BLUEPRINT|BUILD|OUR|MY)\b/ }, // Match numbers
        { type: 'IDENTIFIER', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ }, // Match valid identifiers first



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


        { type: 'NOT_OP', regex: /!/ },

        { type: 'LOGICAL_OP', regex: /&&|\|\|/},
          
        { type: 'EQUALITY_OP', regex: /==|!=/},
        { type: 'RELATIONAL_OP', regex: />|<|>=|<=/},
          

        { type: 'STAT_TERMINATOR', regex: /;/},
        { type: 'ASSIGNMENT', regex: /=/},  
        { type: 'COLON', regex: /:/},
        { type: 'QUESTION', regex: /\?/},
        { type: 'COMMA', regex: /,/},

        { type: 'DEC_LITERAL', regex: /\b\d+\.\d+\b/ }, 
        { type: 'NUM_LITERAL', regex: /\b\d+\b/ }, 


        { type: 'SYMBOL_LITERAL', regex: /(['"])[^'"]\1/ },
        { type: 'WORDING_LITERAL', regex: /"[^"]*"/ },




        //{ type: 'DOT_OP', regex: /./ },

        
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

        for (let { type, regex, categoryMap } of tokenTypes) {
            const match = regex.exec(remainingSource);

            if (match && match.index === 0) {
                const value = match[0];

                if (type !== 'WHITESPACE') {
                    // Add the matched token to the list
                    let token = { type, value };
                    token = Categorize([token])[0]; // Categorize the single token
                    tokens.push(token);



                    if (type === 'DATATYPE') {
                        // Track different datatypes
                        if (value === 'shape') hasShapeDataType = true;
                        if (value === 'color') hasColorDatatype = true;
                        if (value === 'emo' || value === 'emotion') hasEmotionDatatype = true;
                        if (value === 'item') hasItemDatatype = true;
                        if (value === 'Recipe') hasRecipeDatatype = true;

                    }

                    if (type === 'ASSIGNMENT') hasAssignmentOp = true;


                    LiteralChecker(value, token, tokens, hasAssignmentOp, hasShapeDataType, hasColorDatatype, hasEmotionDatatype, hasItemDatatype, hasRecipeDatatype);


                }



                // Advance the position after the match
                currentPosition += value.length;
                matchFound = true;
                
                break; // Stop checking other patterns once we find a match
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
            // If the value is a valid color literal, push the COLOR_LITERAL token
            token = { type: 'SHAPE_LITERAL', value }; // Create COLOR_LITERAL token
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasColorDatatype) {
        if (ColorLiteralChecker(value)) {
            // If the value is a valid color literal, push the COLOR_LITERAL token
            token = { type: 'COLOR_LITERAL', value }; // Create COLOR_LITERAL token
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasEmotionDatatype) {
        if (EmotionLiteralChecker(value)) {
            // If the value is a valid color literal, push the COLOR_LITERAL token
            token = { type: 'EMOTION_LITERAL', value }; // Create COLOR_LITERAL token
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasItemDatatype) {
        if (ItemLiteralChecker(value)) {
            // If the value is a valid color literal, push the COLOR_LITERAL token
            token = { type: 'ITEM_LITERAL', value }; // Create COLOR_LITERAL token
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }

    if (hasAssignmentOp && hasRecipeDatatype) {
        if (RecipeLiteralChecker(value)) {
            // If the value is a valid color literal, push the COLOR_LITERAL token
            token = { type: 'RECIPE_LITERAL', value }; // Create COLOR_LITERAL token
            tokens.pop();  // Removes Identifier Duplicate
            tokens.push(token);
        } 
    }
}