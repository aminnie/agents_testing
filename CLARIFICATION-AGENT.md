# Clarification Agent Prompt Template

Use this prompt after feature analysis when you want to finalize requirement decisions before implementation.

```text
Please update requirements/analysis_feature<N>.md with the following decisions:

For the Open Questions:
1. <decision 1>
2. <decision 2>
3. <decision 3>

Please convert these decisions into explicit requirements and update the What Changed section.
```

Example:

```text
Please update requirements/analysis_feature3.md with the following decisions:

For the Open Questions:
1. Also allow manual header override.
2. Make create/edit available on both pages.
3. For non-editor users, disable the control and add a tooltip.

Please convert these decisions into explicit requirements and update the What Changed section.
```
