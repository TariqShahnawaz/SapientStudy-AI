# Quiz difficulty experiment

## Sample notes

Use the same notes for each difficulty condition.

### Sample 1 — Linear regression

Linear regression predicts a continuous outcome from one or more input variables. A simple model is `y = b0 + b1x`, where `b1` is the slope and `b0` is the intercept. Ordinary least squares chooses coefficients that minimize the sum of squared residuals.

### Sample 2 — Regression assumptions

Common linear-regression assumptions include linearity, independent observations, normally distributed residuals, and constant residual variance (homoscedasticity). Residual plots help identify patterns and changing variance.

### Sample 3 — Model diagnostics

Multicollinearity occurs when input variables are strongly related and can make coefficient estimates unstable; variance inflation factor (VIF) is one diagnostic. Outliers can pull an ordinary least-squares line because residuals are squared. Ridge regularization shrinks coefficients, while Lasso can shrink some coefficients to zero.

## Procedure

1. Generate one Easy, one Medium, and one Hard quiz for each sample note (nine quizzes total), keeping question count and all other settings consistent.
2. Ask 3–5 people to rate perceived difficulty from 1 (very easy) to 5 (very hard), without showing them the selected difficulty label.
3. For each quiz, compare the topic labels to the source notes. Mark each major concept as covered / not covered and note unsupported claims.
4. Report rating averages and coverage observations; do not claim statistical significance for this small sample.

## Illustrative example data — simulated, not collected

The filled-in values below are simulated solely to demonstrate how to summarize this experiment. No participants supplied these ratings, and the example topic labels were not produced by a Gemini run. Replace this section with actual blinded participant ratings and labels from the nine generated quizzes before treating it as evidence.

## Participant ratings

| Sample | Selected difficulty | Participant 1 (1–5) | Participant 2 | Participant 3 | Participant 4 | Participant 5 | Average |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Easy | 2 | 2 | 3 | — | — | 2.3 |
| 1 | Medium | 3 | 3 | 4 | — | — | 3.3 |
| 1 | Hard | 4 | 4 | 5 | — | — | 4.3 |
| 2 | Easy | 2 | 3 | 2 | — | — | 2.3 |
| 2 | Medium | 3 | 4 | 3 | — | — | 3.3 |
| 2 | Hard | 4 | 5 | 4 | — | — | 4.3 |
| 3 | Easy | 2 | 2 | 3 | — | — | 2.3 |
| 3 | Medium | 3 | 4 | 3 | — | — | 3.3 |
| 3 | Hard | 5 | 4 | 4 | — | — | 4.3 |

## Topic-label coverage check

The expected topics are derived from the sample notes. The example generated-label entries below are simulated to demonstrate a coverage review; they are not actual Gemini outputs.

| Sample / difficulty | Topics expected from notes | Topics represented in generated labels | Missing / unsupported concepts |
| --- | --- | --- | --- |
| 1 / Easy | Continuous-outcome prediction; input variables; slope; intercept; OLS minimizing squared residuals | Predicted outcome; slope; intercept | OLS objective omitted |
| 1 / Medium | Continuous-outcome prediction; input variables; slope; intercept; OLS minimizing squared residuals | Slope interpretation; prediction from an input change; OLS residuals | Intercept omitted |
| 1 / Hard | Continuous-outcome prediction; input variables; slope; intercept; OLS minimizing squared residuals | Coefficient interpretation; prediction; squared residual minimization | No unsupported topics in this example |
| 2 / Easy | Linearity; independence; residual normality; homoscedasticity; residual plots | Linearity; independence; normal residuals | Homoscedasticity and residual plots omitted |
| 2 / Medium | Linearity; independence; residual normality; homoscedasticity; residual plots | Residual plot patterns; changing variance; independence | Normality omitted |
| 2 / Hard | Linearity; independence; residual normality; homoscedasticity; residual plots | Diagnosing nonlinearity; heteroscedastic residual pattern; residual normality | Independence omitted |
| 3 / Easy | Multicollinearity; unstable coefficients; VIF; outlier influence on OLS; Ridge shrinkage; Lasso feature selection | Multicollinearity; VIF; Ridge; Lasso | Outlier influence omitted |
| 3 / Medium | Multicollinearity; unstable coefficients; VIF; outlier influence on OLS; Ridge shrinkage; Lasso feature selection | VIF interpretation; coefficient instability; outlier effect; Ridge shrinkage | Lasso omitted |
| 3 / Hard | Multicollinearity; unstable coefficients; VIF; outlier influence on OLS; Ridge shrinkage; Lasso feature selection | Comparing Ridge and Lasso; outlier sensitivity; VIF diagnostics | No unsupported topics in this example |

## Observations and limitations

- Illustrative example only: simulated average perceived difficulty increases from 2.3 (Easy) to 3.3 (Medium) to 4.3 (Hard) across these three sample notes.
- Illustrative example only: the sample coverage table shows labels becoming more application/synthesis-oriented as difficulty rises, but also demonstrates that some source concepts may be omitted.
- Actual perceived-difficulty trend and actual topic-label coverage: Not assessed; real participants have not rated the quizzes and actual quiz outputs have not been entered.
- Limitations: The experiment needs nine actual generated quizzes and 3–5 participant ratings per quiz. Keep settings consistent, hide difficulty labels from participants, and replace all simulated values before reporting results.
- Surprises, prompt adjustments, and other observations: Pending actual experiment.
