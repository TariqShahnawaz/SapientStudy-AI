# How quiz generation works in SapientStudy-AI

The quiz feature is a chain of steps, not just a button that asks AI for questions. In `index.html`, the user can choose a quiz difficulty and question count, then enter study notes. In `app.js`, `handleGenerate()` checks that the input is usable, shows a loading state, and starts the request. The `callGeminiAPI()` function gathers the notes and selected options and passes them to `buildPrompt()` in `prompts.js`.

`buildQuizPrompt()` turns those choices into clear instructions for Gemini. It tells the model to use the supplied notes, follow the selected difficulty, create the requested number of questions, and return a specific JSON structure with a topic, four options, the correct answer, and an explanation. `requestGemini()` in `gemini.js` sends that prompt to Google. The API key goes in a request header, rather than being added to the URL.

The app does not assume the model followed every instruction. `parseQuiz()` in `parsers.js` checks that the response is valid JSON and that every question has the required fields. If the response is malformed, the app shows an error and lets the user retry instead of displaying broken quiz content. If it passes validation, `renderQuiz()` in `app.js` builds the questions using text nodes. The answers and explanations remain hidden until `toggleQuizAnswers()` reveals them.

I think of this flow like a kitchen order: the notes and settings are the order, the prompt is the recipe, Gemini prepares a result, and the parser checks that the dish matches what was requested before it is served. Tracing the code helped me see that using AI in an app also means checking and safely presenting its output; a good prompt alone cannot guarantee a usable result.
