export function Categorize(tokens) {
    return tokens.map(token => {
        switch (token.type) {
            case 'ARITHMETIC_OP':
                switch (token.value) {
                    case '+':
                        return { ...token, category: 'Add_Op' };
                    case '-':
                        return { ...token, category: 'Sub_Op' };
                    case '*':
                        return { ...token, category: 'Mul_Op' };
                    case '/':
                        return { ...token, category: 'Div_Op' };
                    case '%':
                        return { ...token, category: 'Mod_Op' };
                    default:
                        return { ...token, category: 'Unknown_Arithmetic_Op' };
                }

            case 'RELATIONAL_OP':
                switch (token.value) {
                    case '>':
                        return { ...token, category: 'Greater_Than' };
                    case '<':
                        return { ...token, category: 'Less_Than' };
                    case '>=':
                        return { ...token, category: 'Greater_Than_Or_Equal' };
                    case '<=':
                        return { ...token, category: 'Less_Than_Or_Equal' };
                    default:
                        return { ...token, category: 'Unknown_Relational_Op' };
                }

            case 'EQUALITY_OP':
                switch (token.value) {
                    case '==':
                        return { ...token, category: 'Equals' };
                    case '!=':
                        return { ...token, category: 'Not_Equals' };
                    default:
                        return { ...token, category: 'Unknown_Equality_Op' };
                }

            case 'LOGICAL_OP':
                switch (token.value) {
                    case '&&':
                        return { ...token, category: 'Logical_And' };
                    case '||':
                        return { ...token, category: 'Logical_Or' };
                    default:
                        return { ...token, category: 'Unknown_Logical_Op' };
                }

            case 'DATATYPE':
                switch (token.value) {
                    case 'num':
                    case 'number':
                        return { ...token, category: 'Numeric_Type' };
                    case 'dec':
                    case 'decimal':
                        return { ...token, category: 'Decimal_Type' };
                    case 'symb':
                    case 'symbol':
                        return { ...token, category: 'Symbol_Type' };
                    case 'Word':
                    case 'Wording':
                        return { ...token, category: 'Wording_Type' };
                    case 'ans':
                    case 'answer':
                        return { ...token, category: 'Answer_Type' };
                    case 'shape':
                        return { ...token, category: 'Shape_Type' };
                    case 'color':
                        return { ...token, category: 'Color_Type' };
                    case 'emo':
                    case 'emotion':
                        return { ...token, category: 'Emotion_Type' };
                    case 'item':
                        return { ...token, category: 'Item_Type' };
                    case 'Recipe':
                        return { ...token, category: 'Recipe_Type' };

                    default:
                        return { ...token, category: 'Unknown_Data_Type' };
                }

                case 'OOP_KW':
                    switch (token.value) {
                        case 'BLUEPRINT':
                            return { ...token, category: 'BLUEPRINT' };
                        case 'OUR':
                            return { ...token, category: 'OUR' };
                        case 'MY':
                            return { ...token, category: 'MY' };
                        case 'BUILD':
                            return { ...token, category: 'BUILD' };
                        default:
                            return { ...token, category: 'Unknown_Logical_Op' };
                    }

            default:
                return { ...token, category: '' };
        }
    });
}
