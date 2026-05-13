# Cost And Scale Estimate

Updated: 2026-05-13

## Scope

This estimate covers the current UNITHING implementation using Vercel + Supabase + Gemini API.

Primary references:

- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel account plans: https://vercel.com/docs/plans
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Supabase pricing: https://supabase.com/pricing

## Current Paid API Actions

The current code uses `process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'`.

Gemini 2.5 Flash standard paid tier is:

- Input: `$0.30 / 1M tokens` for text, image, video input.
- Output: `$2.50 / 1M tokens`, including thinking tokens.

The current generation config sets `thinkingBudget: 0` only for `api/analyze/segibu`. Other routes do not set a thinking budget, so output-token variance should be watched in real usage.

| Action | Route | Gemini calls | Practical unit estimate |
| --- | --- | ---: | ---: |
| Student record analysis | `/api/analyze/segibu` | 1, plus 1 repair call only if JSON parsing fails | `$0.02-$0.08` per successful analysis |
| Seteuk helper full flow | `/api/analyze/seteuk` | 4 small GET calls + 2 POST calls | `$0.006-$0.02` per complete workflow |
| Curriculum PDF parse | `/api/parse/curriculum-pdf` | 1 PDF call | `$0.003-$0.015` per parse |
| Subject recommendation | `/api/recommend/subjects` | 1 text call | `$0.002-$0.008` per recommendation |

## Monthly Gemini Estimate

Assumption: 100 teachers/day, 30 active days/month = 3,000 teacher-days.

| Scenario | Daily behavior | Monthly estimate |
| --- | --- | ---: |
| Light pilot | 30 student analyses/day, 20 seteuk workflows/day, 10 subject recommendations/day, 3 curriculum parses/day | `$25-$55/mo` |
| Expected school rollout | 50 student analyses/day, 30 seteuk workflows/day, 40 subject recommendations/day, 10 curriculum parses/day | `$55-$115/mo` |
| Heavy day-everyone-uses-it | 100 student analyses/day, 100 seteuk workflows/day, 100 subject recommendations/day, 20 curriculum parses/day | `$120-$260/mo` |

Operational recommendation: start with a monthly Gemini guardrail around `$150-$250`, then replace estimates with actual token usage logs after 1-2 weeks.

## Weekday 100-User Operating Estimate

Assumption: 100 active teachers on weekdays only, about 21.7 weekdays/month = about 2,170 active teacher-days/month.

This reflects the current guardrail direction: student record analysis is treated as one saved analysis per student, failed saves retry storage only, and saved results do not show a casual reanalysis button.

Rough usage mix:

- 1 student record analysis per active teacher-day.
- 40% of active teacher-days complete a seteuk helper flow.
- 30% use AI subject recommendation.
- 5 curriculum PDF parses per weekday.
- Exchange estimate: `$1 = ₩1,460`.

| Cost item | Monthly USD | Monthly KRW |
| --- | ---: | ---: |
| Gemini API, conservative-low | `$50` | `₩73,000` |
| Gemini API, expected | `$125` | `₩183,000` |
| Gemini API, busy/high | `$200` | `₩292,000` |
| Vercel Pro, 1 developer seat | `$20` | `₩29,000` |
| Supabase Pro, optional production baseline | `$25` | `₩37,000` |

Expected monthly operating budget:

- Vercel Pro + Gemini: about `$145/mo`, roughly `₩210,000/mo`.
- Vercel Pro + Supabase Pro + Gemini: about `$170/mo`, roughly `₩250,000/mo`.
- Practical budget line with buffer: `₩300,000/mo`.
- Recommended alert ceiling while piloting: `₩400,000/mo`.

If teachers analyze more than one student per day, multiply only the Gemini student-analysis portion. For example, 2 student analyses per active teacher-day adds roughly another `$110-$125/mo` expected, or about `₩160,000-₩183,000/mo`.

## Vercel Suitability For 100+ Teachers/Day

Vercel Hobby included usage currently lists 1,000,000 function invocations, 100 GB-hours function duration, 100 GB Fast Data Transfer, 4 CPU-hours active CPU, and 360 GB-hours provisioned memory. It also states Hobby is for non-commercial personal use and that exceeding included usage can pause access until the period resets.

For 100 teachers/day:

- Requests/invocations are likely fine: 3,000 monthly sessions with ordinary dashboard navigation should stay far below 1,000,000 function invocations.
- Data transfer is likely fine if PDFs are not stored/served through Vercel Blob and large files are not downloaded repeatedly.
- Function duration is the main technical risk because AI analysis routes wait synchronously for Gemini. Hobby has a 10s default function duration and can be configured up to 60s; slow PDF analysis can run near that ceiling.
- Commercial/team usage is the main policy risk. CAMPUS MENTOR production use with 100+ teachers/day should be treated as Pro-level, even if raw limits look sufficient.

Recommendation: keep Hobby only for pilot/demo. For a real teacher rollout, move to Vercel Pro before broad access.

## Supabase / Storage Direction

The new `error_reports` table stores text/json reports only, not files. This is tiny compared with Supabase Free's 500 MB database size.

Supabase is the better immediate storage target because UNITHING already uses it for `teachers` and `students`. Oracle can be considered later if there is a company-wide log warehouse or compliance reason, but it adds another network dependency and credential surface today.

Production recommendation:

- Keep reports in Supabase.
- Do not store raw PDFs or unredacted student records in `error_reports`.
- Use mail only as a notification copy, not as the source of truth.
- Configure mail notification with `UNITHING_MAIL_TO` plus either `UNITHING_RESEND_API_KEY` or `UNITHING_MAIL_WEBHOOK_URL`/`UNITHING_MAIL_WEBHOOK_SECRET`. The webhook path must use HTTPS and verify the `X-Unithing-Signature` HMAC header.
- Consider Supabase Pro when production data should have daily backups and support.

## Cost Guardrails To Add Next

- Persist Gemini usage metadata per action if the SDK response exposes token usage.
- Add an admin usage page: daily calls by action, estimated token cost, error rate.
- Keep `AI_DAILY_LIMIT_SEGIBU`, `AI_DAILY_LIMIT_SETEUK`, and `AI_DAILY_LIMIT_SUBJECTS` in Vercel env and tune them during pilot.
- Disable automatic paid retries. For `segibu`, keep the JSON repair retry but track it separately because it is a second billable call.
