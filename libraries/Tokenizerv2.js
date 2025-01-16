export function tokenize(sourceCode) {

    const tokenTypes = [
        {type: 'IDENTIFIER', regex: /[a-zA-Z_][a-zA-Z0-9_]*|[_][a-zA-Z0-9_]+/},  // Match valid identifiers first
        {type: 'KEYWORD', regex: /\b(if|else|while|return|function)\b/},  // Match keywords with boundaries
        {type: 'DATATYPE', regex: /\b(num|dec|letter|ans|color|shape|ingredient)\b/},  // Match data types with boundaries
        {type: 'WHITESPACE', regex: /\s+/},  // Match whitespace
        {type: 'DIGIT', regex: /\b[0]|[1-9][0-9]*\b/},
        {type: 'EQ_SIGN', regex: /=/},
        {type: 'COLOR_LITERAL', regex: /\b(Red|Blue|Yellow)\b/}
    ];
    
    
        const tokens = [];
        let currentPosition = 0;
        const codeStream = sourceCode.split(/\s+/);

        for (let current = 0; current < codeStream.length; current++){

            let currentWord = codeStream[current];

            

            for (let {type, regex} of tokenTypes) {


                const match = regex.exec(currentWord);


        }

    
        while (currentPosition < sourceCode.length) {
            let matchFound = false;
            const remainingSource = sourceCode.slice(currentPosition);
    
            console.log(`Remaining source: "${remainingSource}" , LENGTH: ${sourceCode.length - currentPosition}`);
    
            // Try to find the longest possible match first for identifiers
            for (let {type, regex} of tokenTypes) {
                const match = regex.exec(remainingSource);
    
                // If a match is found
                if (match) {
                    const value = match[0];
    
                    // If it's not a whitespace token, add it to the tokens array
                    if (type !== 'WHITESPACE') {
                        // Handle identifiers first before keywords




                        if (type === 'IDENTIFIER') {
                            // Check if the identifier is a keyword (to handle cases like "if" or "return")
                            if (/\b(if|else|while|return|function)\b/.test(value)) {
                                // Treat as a keyword
                                console.log("KEYWORD");
                                tokens.push({type: 'KEYWORD', value});
                            } 
                            
                            else if (/\b(num|dec|letter|ans|color|shape|ingredient)\b/.test(value)) {
                                // Treat as a keyword
                                console.log("DATATYPE");
                                tokens.push({type: 'DATATYPE', value});
                            } 
    
                            else if (/[0-9]|[1-9][0-9]*/.test(value)) {
                                // Treat as a keyword
                                console.log("DIGIT");
                                tokens.push({type: 'DIGIT', value});
                            } 


                            else if (tokens.includes("DATATYPE") && tokens.includes("EQ_SIGN")){
                                
                                console.log("PASOK");

                                if (/\b(Red|Blue|Yellow)\b/.test(value)) {
                                // Treat as a keyword
                                console.log("COLOR");
                                tokens.push({type: 'COLOR_LITERAL', value});
                            } 


                            }


                            
                            else {
                                console.log("IDENTIFIER");
                                tokens.push({type, value});
                            }
                        }
    
                        // Handle keywords if found
                        else if (type === 'KEYWORD') {
                            console.log("KEYWORD");
                            tokens.push({type, value});
                        }
    
                        else {
                            console.log("OTHERS");
                            tokens.push({type, value});
                        }
    
                        // Advance the position after the match
                        currentPosition += value.length + 1;
                        matchFound = true;
                        break;  // Stop checking other patterns once we find a match
                    }
                    else {
                        // Skip whitespace without adding it to tokens
                        currentPosition += value.length + 1;
                        matchFound = true;
                        break;
                    }
                }
            }
    
            // If no match is found, throw an error with the character that caused the issue
            if (!matchFound) {
                console.log(`No match found at position ${currentPosition}: ${sourceCode[currentPosition]}`);
                throw new Error(`Unexpected Character at position ${currentPosition}: ${sourceCode[currentPosition]}`);
            }
    
            // If there are no valid matches, stop processing
            if (remainingSource.length === 1 && !matchFound) {
                break;
            }
        }
    
        return tokens;
    }
    
}
    
    
