# Movementizer - App Store metadata

Copy these fields into App Store Connect. Character counts below are for the limits Apple enforces today. Confirm the boxes on the day you paste.

## Listing

| Field | Value |
| --- | --- |
| Name | Movementizer |
| Subtitle | Earth radar for movements |
| Promotional text | One window for every movement on Earth. Scale as last seen. Real video. We do not award victory. |
| Primary category | News |
| Secondary category | Reference |
| Bundle ID | com.khardhridayainc.movementizer |
| SKU | movementizer |
| Version | 1.0.0 |
| Copyright | 2026 KHARD HRIDAYA Inc. |
| Support URL | https://movementizer.com/support |
| Privacy Policy URL | https://movementizer.com/privacy |
| Marketing URL | https://movementizer.com/ |

Subtitle is 25 characters (limit 30). Promotional text is 97 characters (limit 170).

## Description

Movementizer is the Earth radar for movements. Each movement has one window. The scale is the last figure we could check. The status is Live, Still on, or Fulfilled. We do not award victory.

Open a window for the place, the claim, photos, and video. Press play when you want the video. Share sends that window through the iPhone share sheet.

From the ground, record a video of up to 60 seconds or upload a photo or video you already have. A random handle is enough. Nothing you post is public until a person approves it. You can report a clip and block a poster.

The app keeps the radar on movementizer.com. A link that leaves the site opens in Safari.

Offline, the app shows its own screen and a Retry button. Pull down on the radar to refresh. A light tap is felt when you open a window, share, or refresh.

Alerts are off until you turn them on. The switch is at the top of the app. If you turn it on, this phone remembers the public Live, Still on, and Fulfilled labels and checks them again the next time you open the app. A change can post a notification on this device. Nothing is checked while the app is closed, and the list is not sent to a server.

## Keywords

```
movement,radar,protest,activism,earth,live,registry,news,street,campaign
```

72 characters (limit 100). No spaces.

## Age rating

Answer from what the app actually shows. The registry is news about public movements. From the ground, people can record real protest footage before a moderator sees it. The uploader can see their own clip while it says Under review. Approved clips can still show a street, police, or a crowd. Apple calculates the rating. Use 17+.

Why 17+: the capture itself is not filtered before the person records. Pre-moderation keeps the public feed closed until approval, and the automatic check rejects sexual content, gore, spam, and clips that are not about the movement. It does not auto-reject ordinary protest violence, because that is the subject. A 12+ answer would understate what a person can record and then see on their own phone.

| Question | Answer |
| --- | --- |
| Cartoon or fantasy violence | None |
| Realistic violence | Frequent / Intense |
| Prolonged graphic or sadistic realistic violence | None |
| Profanity or crude humor | Infrequent / Mild |
| Mature or suggestive themes | None |
| Horror or fear themes | None |
| Medical or treatment information | None |
| Alcohol, tobacco, or drug use | None |
| Simulated gambling | None |
| Sexual content or nudity | None |
| Contests | None |
| Unrestricted web access | No |
| User-generated content | Yes |
| Messaging and chat | No |
| Advertising | No |

Unrestricted web access is No because the in-app page stays on movementizer.com and www.movementizer.com. Other http and https links open in Safari. User-generated content is Yes. The public feed is pre-moderated. Sexual content is not meant to appear: the terms forbid it, the automatic check rejects it when a key is set, and a person still has to approve a clip.

## Privacy nutrition label

Answer from the code in this repo, not from a template.

Tracking: No. There is no advertising ID, no App Tracking Transparency prompt, and no analytics SDK.

Data the publisher does not receive from the app:

- No account, real name, email, or phone number. A poster gets a random id and a random handle, stored on the device and sent with a clip.
- No precise or coarse GPS. The phone's location is never requested. A place is stored only if the person types one.
- No contacts. The camera, microphone, and photo library are used only after the person taps Record or Upload.
- No purchases.
- No health or financial data.
- The website does not set cookies. It does use local storage for the random id, the handle, the terms acceptance time, and the on-device block list.
- The Alerts switch stores two things on the phone only (AsyncStorage): whether alerts are on, and the last public status of each window. That list is not uploaded. It does not need its own nutrition-label row if it never leaves the device.

Data that does leave the device, because the app loads the public site:

- Delivering a page means the host (Vercel) can see the IP address, the time, the URL, and the user agent. The privacy policy says those logs are not used to recognize someone on a later visit or to build a profile.
- The page then requests Google Fonts, photos from Wikimedia Commons, and YouTube thumbnails (i.ytimg.com). Pressing play loads a player from youtube-nocookie.com. YouTube says that privacy-enhanced mode is for a player on a website, not for a player inside an app view, so treat playback in this app as YouTube's own collection. A YouTube watch link opens in Safari.
- Share opens the system sheet. The app does not keep a record of the share. A destination receives the link only if the person continues there.

Recommended App Privacy answers:

| Prompt | Answer |
| --- | --- |
| Do you or your third-party partners collect data from this app? | Yes |
| Data used to track the user | None |
| Data linked to the user's identity | None |
| Usage Data > Product Interaction | Collected, not linked, purpose App Functionality |
| Identifiers > Device ID | Collected, not linked, purpose App Functionality |
| Identifiers > User ID | Collected, not linked, purpose App Functionality |
| User Content > Photos or Videos | Collected, not linked, purpose App Functionality |
| User Content > Other User Content | Collected, not linked, purpose App Functionality |

User ID is the random poster id, not an Apple ID and not a real name. Photos or Videos are the clips. Other User Content is the caption and an optional typed place name. Do not mark any of these as used for tracking. Do not mark them as linked to identity. The block list never leaves the device.

Use the Device ID row for the IP address in the host log. Do not mark the data as used for tracking. Do not choose "Data Not Collected" for the whole app. Third-party requests (fonts, photos, YouTube) are covered by naming those partners if Connect asks for them. Purposes other than App Functionality (Third-Party Advertising, Developer's Advertising, Analytics, Product Personalization) are No.

## Export compliance

`ITSAppUsesNonExemptEncryption` is false. The app uses HTTPS only. In the export questionnaire, answer that the app does not use non-exempt encryption.

## Review notes

Paste this into App Review Information. Sign-in is not required. There is no demo account.

```
No account and no sign-in.

The app is a native shell around https://movementizer.com. Pages on movementizer.com and www.movementizer.com stay in the app. News links, photo credits, and YouTube watch links open in Safari. A YouTube embed plays inside the window only after the reader presses play.

Airplane mode: the app shows a native offline screen with Retry. Pull down on the radar to refresh.

Open any movement and tap Share. That opens the iOS share sheet. The app does not keep a record of the share.

Alerts is the button at the top. It is off by default. Turning it on asks for notification permission and saves the current public Live / Still on / Fulfilled labels on the device. The next time the app is opened, a local notification can appear if one of those labels changed. Nothing is checked while the app is closed. There is no push server.

From the ground: open a movement and tap Record or Upload. Before the first post the app requires acceptance of the terms, which state zero tolerance for objectionable content, including sexual content, gore, threats, harassment, spam, and content that is not about the movement. There is no tolerance for sexual content involving a minor.

A new clip is pending. It is not on the public feed. The uploader sees Under review on their own clip. If AI_GATEWAY_API_KEY is set, a still frame and the caption go through Vercel AI Gateway. Clear junk (sexual content, gore, spam, or a clip that is not about the movement) is rejected. Other clips, including ordinary protest footage, are marked needs review. If no key is set, the clip stays pending. A moderator uses https://movementizer.com/admin (token is not in the app) to Approve, Reject, or Ban. Trust lets a proven poster skip the human queue later, unless the automatic check rejects the clip.

Every approved clip has Report. Three reports from different people hide it. Block hides that poster on this device only. The public feed shows approved clips only.

The home-page sentence about the Internet Archive and Filecoin describes a path that is not built. Nothing is sent there.

Contact: hridaya.8888@gmail.com
Support URL: https://movementizer.com/support
```

## Build and submit

From the `mobile/` directory, after the human steps below:

```
npx eas-cli@latest build -p ios --profile production --auto-submit
```

`eas.json` uses the production profile (`distribution: store`, `autoIncrement: true`, `appVersionSource: remote`). The iOS build number in git stays `1`. EAS stores the next build number. `submit.production.ios` is present and has no `ascAppId`, so the first `eas build --auto-submit` can create or select the App Store Connect app in the prompt.

## Steps a person has to do

1. Sign in to Expo as the owner `khardhridaya` (`npx eas-cli@latest login` from `mobile/`). Run `npx eas-cli@latest init` there and link this app. Do not invent a project id. The owner in `app.json` is already `khardhridaya`.
2. Confirm an Apple Developer Program membership that can create the bundle id `com.khardhridayainc.movementizer`.
3. From `mobile/`, run the build command above. When EAS asks, create or select the App Store Connect app for that bundle id. Complete the Apple credential prompts (distribution certificate, provisioning profile, and an App Store Connect API key or app-specific password). `autoIncrement` will bump the build number on EAS.
4. Paste the listing, keywords, age-rating answers, privacy answers, and review notes from this file. Set the support, privacy, and marketing URLs in the table above.
5. Add screenshots. This repo was prepared on a machine with no iOS Simulator, so the screenshots are not included. App Store Connect will ask for the sizes. Plan on the 6.9-inch iPhone set (1320 x 2868) or the 6.7-inch set (1290 x 2796), plus a 13-inch iPad set (2064 x 2752) because `supportsTablet` is true. Use the sizes Connect lists that day.
6. Create the services in the next section and set the env vars on the Vercel project before reviewers can post. Ship this branch's website when you want the live pages to include From the ground.

## Services a person must create

Do not commit real values. Names match `.env.example`.

| Env var | Service |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | A private Vercel Blob store. Pending files must not be public URLs. `vercel blob create-store movementizer-ground --access private` |
| `DATABASE_URL` | Neon Postgres from the Vercel Marketplace (`vercel integration add neon`). Tables are created on the first request. |
| `ADMIN_TOKEN` | A long random string you choose. It opens `/admin`. |
| `AI_GATEWAY_API_KEY` | Optional. Vercel AI Gateway key. If it is empty, the automatic check is skipped and every new clip stays pending. |
| `GROUND_AI_MODEL` | Optional. Default `google/gemini-2.5-flash`. |

`GROUND_AI=1` turns the check on with `VERCEL_OIDC_TOKEN` when you do not want a separate gateway key. `GROUND_AI=0` forces the check off.

Decisions already made in the code, so a person does not have to pick them unless they disagree:

- Metadata is Neon, not Redis, because the queue, reports, bans, and trusted flag are rows.
- The place field is text the person types. The app never requests GPS. Photos are re-encoded so camera location is dropped. A video recorded in the app is a new file. A video uploaded from the camera roll is not transcoded, so the original file can still contain metadata. We do not read it.
- Protest violence is flagged for a person. It is not auto-rejected. Sexual content, gore, spam, and irrelevant clips are auto-rejected when the AI key is set.
- Block is on the device. Ban is server-side.
- Trusted posters skip the human queue unless the automatic check rejects the clip. With no AI key, a trusted post goes live and every other post stays pending.
- The server enforces file size and type. The 60 second video limit is enforced on the device. A modified client could lie about duration. A moderator can still reject the clip.
