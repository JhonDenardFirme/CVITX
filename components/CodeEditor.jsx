'use client'
import React from 'react'
import { useState } from 'react'

import { tokenize } from '@/libraries/Tokenizer' 
import { generateAST } from '@/libraries/ASTGenerator'


const CodeEditor = () => {

    const [code, setCode] = useState("");
    const [tokens, setTokens] = useState([]);
    const [ast, setAst] = useState({});

    const handleChange = (e) => {
        setCode(e.target.value);
    }


    const handleSubmit = async () => {
        try {
            const newTokens = tokenize(code); // Tokenize the code
            setTokens(newTokens); // Update tokens state
    
            // Wait for the AST generation if it's asynchronous
            const newAst = await generateAST(newTokens); // Generate AST from tokens
            console.log('Generated AST:', newAst); // Log AST for debugging
            setAst(newAst); // Update AST state
    
            console.log('Tokens:', newTokens); // Log tokens for debugging
            console.log('AST:', newAst); // Log AST for debugging
            console.log("SUBMITTED");
        } catch (error) {
            console.error("Error processing the code:", error);
        }
    };
    


  return (
    
            <div className="w-full h-[100vh] bg-neutral-950 flex flex-col justify-center items-center">

                <div className="text-4xl text-slate-50 font-bold">
                KiddoCode
                </div>

                <div className="w-2/3 h-4/5 grid grid-cols-2">

                
                <div className="code_editor w-full h-full col-span-1 flex flex-col items-center justify-center py-16 px-16">
                    <p className="text-base">Code Editor</p>
                    <textarea className="bg-transparent border-[1px] border-neutral-800 rounded-xl justify-start items-center text-sm font-mono text-neutral-50 
                    w-full h-full overflow-y-auto py-4 px-4 mt-4 focus:outline-none 
                    
                    " onChange={handleChange}>

                    </textarea>

                    <button className="bg-blue-500 text-slate-50 py-2 px-8 rounded-lg mt-8 text-sm hover:cursor-pointer" onClick={handleSubmit}>
                    SUBMIT
                    </button>
                </div>




                <div className="code_editor w-full h-full col-span-1 flex flex-col items-center justify-center py-16 px-16">
                    <p className="text-base">Tokens</p>
                    <textarea className="bg-transparent border-[1px] border-neutral-800 rounded-xl justify-start items-center text-sm font-mono text-neutral-50 
                    w-full h-full overflow-y-auto py-4 px-4 mt-4 focus:outline-none
                    " readOnly
                    value={tokens.map(token => `${token.type}: ${token.value}${token.category ? ` (${token.category})` : ''}`).join('\n')}  // Display tokenized code, separated by newlines
                    >

                    

                    </textarea>


                </div>

                        {/* AST Display */}
                <div className="code_editor w-full h-full col-span-2 flex flex-col items-center justify-center py-16 px-16">
                <p className="text-base">AST</p>
                <textarea
                    className="bg-transparent border-[1px] border-neutral-800 rounded-xl justify-start items-center text-sm font-mono text-neutral-50 w-full h-full overflow-y-auto py-4 px-4 mt-4 focus:outline-none"
                    readOnly
                    value={JSON.stringify(ast, null, 2)} // Display formatted AST
                ></textarea>
                </div>

                </div>





            </div>
    
  )
}

export default CodeEditor


