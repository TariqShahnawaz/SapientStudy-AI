# How quiz generation works

When someone makes a quiz, SapientStudy-AI takes the notes they entered and the difficulty and question count they selected. It combines those choices with instructions that tell Gemini to use only those notes and return questions in a specific JSON format. The app sends that prompt to Gemini with the user's API key in a request header.

The app doesn't assume the AI's reply will be correct or even valid JSON. It checks that each question has a topic, four options, a valid correct-answer letter, and an explanation. If anything is missing or malformed, it shows an error with a retry option instead of treating the response as a usable quiz. Valid questions are added to the page as text, and the answer explanations stay hidden until the user selects “Show answers.”

This matters because the AI creates the content, but the app still needs to check its shape and present it safely and usefully.

> Review this explanation and rewrite it in your own words before submitting it as your personal learning reflection.
