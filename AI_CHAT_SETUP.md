# Ask Cambridge IELTS Expert AI: setup (5 minutes, one time)

The chat page (`ask-cambridge-ielts.html`) talks to a Supabase Edge Function
(`supabase/functions/ask-ielts-ai/index.ts`). The AI key lives only on the server.

## 1. Get a NEW Gemini API key
The old key was written inside the HTML file, so treat it as leaked.
1. Go to https://aistudio.google.com/apikey and delete/revoke the old key.
2. Create a new key.

## 2. Deploy the function
Install the Supabase CLI (https://supabase.com/docs/guides/cli), then in this folder:

    supabase login
    supabase link --project-ref iyamcwbzunwknlvpxxoa
    supabase secrets set GEMINI_API_KEY=PASTE_YOUR_NEW_KEY_HERE
    supabase functions deploy ask-ielts-ai

(No CLI? In the Supabase dashboard: Edge Functions -> Create function ->
name it `ask-ielts-ai`, paste the contents of index.ts, then add the secret
under Edge Functions -> Secrets.)

## 3. Upload the site
Upload the updated `ask-cambridge-ielts.html`. Open it and ask a question.

## Notes
- Model can be changed without editing code: `supabase secrets set GEMINI_MODEL=gemini-2.5-flash`
- Limits: 20 messages per 10 minutes per visitor, 12 messages of memory, 2000 characters per message.
- Errors are shown in the chat (red bubble) so students know what happened.
