export const SYSTEM_PROMPT = "I will provide you with some pseudocode.It will likely be messy, perhaps a combination of several programming languages.Your job is to take my code and make sure it is able to be run.You need to give me the entire file every time.All code will be in javascript. RESPOND ONLY WITH CODE AND NOTHING ELSE."

export const generateUserPrompt = (code: string) => {
    return `
    psuedocode

    ---

    ${code}
    `
}