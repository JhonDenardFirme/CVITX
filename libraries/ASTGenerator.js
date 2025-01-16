export function generateAST(tokens) {
    let currentPosition = 0;

    function currentToken() {
        return tokens[currentPosition];
    }

    function consume() {
        if (currentPosition < tokens.length) {
            currentPosition++;
        }
    }

    function parseProgram() {
        const program = [];

        // Parse the Main declaration if present
        if (currentToken() && currentToken().type === 'MAIN_DECLARATION') {
            program.push(parseMainDeclaration());
        }

        // Parse the remaining statements
        while (currentPosition < tokens.length) {
            program.push(parseStatement());
        }

        return { type: 'Program', children: program };
    }

    function parseMainDeclaration() {
        const token = currentToken();
        if (token.type === 'MAIN_DECLARATION' && token.value === 'task') {
            consume(); // Consume 'task'
            if (currentToken().type === 'IDENTIFIER' && currentToken().value === 'Main') {
                consume(); // Consume 'Main'
                if (currentToken().type === 'LEFT_PAREN') {
                    consume(); // Consume '('
                    if (currentToken().type === 'RIGHT_PAREN') {
                        consume(); // Consume ')'
                        if (currentToken().type === 'LEFT_BRACE') {
                            consume(); // Consume '{'
                            const statements = [];
                            while (currentToken() && currentToken().type !== 'RIGHT_BRACE') {
                                statements.push(parseStatement());
                            }
                            if (currentToken() && currentToken().type === 'RIGHT_BRACE') {
                                consume(); // Consume '}'
                                return {
                                    type: 'MainDeclaration',
                                    body: { type: 'Block', children: statements },
                                };
                            } else {
                                throw new Error(`Expected '}' but found ${currentToken().value} at position ${currentPosition}`);
                            }
                        } else {
                            throw new Error(`Expected '{' but found ${currentToken().value} at position ${currentPosition}`);
                        }
                    } else {
                        throw new Error(`Expected ')' but found ${currentToken().value} at position ${currentPosition}`);
                    }
                } else {
                    throw new Error(`Expected '(' but found ${currentToken().value} at position ${currentPosition}`);
                }
            } else {
                throw new Error(`Expected 'Main' but found ${currentToken().value} at position ${currentPosition}`);
            }
        } else {
            throw new Error(`Expected 'task' but found ${token.value} at position ${currentPosition}`);
        }
    }

    function parseStatement() {
        const token = currentToken();

        if (token.type === 'IDENTIFIER') {
            return parseAssignment();
        }

        if (token.type === 'KEYWORD') {
            return parseKeywordStatement();
        }

        // Handle other statement types here
        throw new Error(`Unexpected token: ${token.value} at position ${currentPosition}`);
    }

    function parseAssignment() {
        const token = currentToken();
        const left = { type: 'Identifier', value: token.value };
        consume();

        if (currentToken().type === 'ASSIGNMENT') {
            consume();
        } else {
            throw new Error(`Expected '=' but found ${currentToken().value} at position ${currentPosition}`);
        }

        const right = parseExpression();
        return { type: 'Assignment', left, right };
    }

    function parseKeywordStatement() {
        const token = currentToken();
        if (token.value === 'opt' || token.value === 'when' || token.value === 'otherwise') {
            consume();
            const condition = parseExpression();
            return { type: 'KeywordStatement', keyword: token.value, condition };
        }

        throw new Error(`Unsupported keyword: ${token.value} at position ${currentPosition}`);
    }

    function parseExpression() {
        let left = parsePrimaryExpression();

        while (currentToken() && currentToken().type === 'ARITHMETIC_OP') {
            const operator = currentToken();
            consume();

            const right = parsePrimaryExpression();
            left = {
                type: 'BinaryExpression',
                left,
                operator: operator.value,
                right
            };
        }

        return left;
    }

    function parsePrimaryExpression() {
        const token = currentToken();

        if (token.type === 'NUM_LITERAL') {
            consume();
            return { type: 'NumberLiteral', value: parseFloat(token.value) };
        }

        if (token.type === 'SYMBOL_LITERAL') {
            consume();
            return { type: 'SymbolLiteral', value: token.value };
        }

        if (token.type === 'COLOR_LITERAL') {
            consume();
            return { type: 'ColorLiteral', value: token.value };
        }

        if (token.type === 'SHAPE_LITERAL') {
            consume();
            return { type: 'ShapeLiteral', value: token.value };
        }

        if (token.type === 'EMOTION_LITERAL') {
            consume();
            return { type: 'EmotionLiteral', value: token.value };
        }

        if (token.type === 'ITEM_LITERAL') {
            consume();
            return { type: 'ItemLiteral', value: token.value };
        }

        if (token.type === 'RECIPE_LITERAL') {
            consume();
            return { type: 'RecipeLiteral', value: token.value };
        }

        if (token.type === 'IDENTIFIER') {
            consume();
            return { type: 'Identifier', value: token.value };
        }

        if (token.type === 'LEFT_PAREN') {
            consume();
            const expr = parseExpression();
            if (currentToken().type === 'RIGHT_PAREN') {
                consume();
                return { type: 'ParenthesizedExpression', expression: expr };
            } else {
                throw new Error(`Expected ')' but found ${currentToken().value} at position ${currentPosition}`);
            }
        }

        throw new Error(`Unexpected token in expression: ${token.value} at position ${currentPosition}`);
    }

    return parseProgram(); // Start parsing the program
}
