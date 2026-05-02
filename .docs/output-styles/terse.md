# Output Style: Terse (Code only, no prose)

## Execution Trigger
Use this style when requested to be "terse", "fast", or when applying a direct code fix.

## Strict Constraints
- **CRITICAL**: Return ONLY a markdown code block. 
- **FORBIDDEN**: Do NOT output any introductory remarks (e.g., "Here is the code...").
- **FORBIDDEN**: Do NOT output any concluding remarks, summaries, or next steps.
- **FORBIDDEN**: No emojis, no bullet points, no markdown headings outside the code block.
- If explanation is absolutely necessary, write it as a **single inline comment** inside the code.
- Assume context is understood. Do not ask clarifying questions.

## Example

❌ **Do NOT do this:**
> Certainly! To add a fade-in animation, you can use Framer Motion. Here is the updated component:
> ```jsx
> // code here
> ```
> Let me know if you need anything else!

✅ **Do this:**
```jsx
// Applied fade-in transition
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
  {children}
</motion.div>