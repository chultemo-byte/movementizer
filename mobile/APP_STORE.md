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

The app keeps the radar on movementizer.com. The first time you open it, a welcome screen asks you to agree. There is no account, no sign-up, and no purchase. After you agree, the radar is the first screen. Privacy, Terms, and Support are in the bar under the title, and the page does not repeat them. A tab bar at the bottom opens Radar, Live, Still on, Fulfilled, and Alerts. Back returns to the previous page. A swipe from the left edge does the same as Back. A link that leaves the site opens in Safari.

Offline, the app shows its own screen and a Retry button. Pull down on the radar to refresh. A light tap is felt when you open a window, share, refresh, or change tabs.

Alerts are off until you turn them on. The switch is on the Alerts tab. If you turn it on, this phone remembers the public Live, Still on, and Fulfilled labels and checks them again the next time you open the app. A change can post a notification on this device. Nothing is checked while the app is closed, and the list is not sent to a server.

## Keywords

```
movement,radar,protest,activism,earth,live,registry,news,street,campaign
```

72 characters (limit 100). No spaces.

## Age rating

Answer from what the app actually shows. The registry text is news about public movements. Some windows include real protest photos and YouTube news video. Apple calculates the rating from these answers. Expect 12+ if realistic violence is set to infrequent and mild.

| Question | Answer |
| --- | --- |
| Cartoon or fantasy violence | None |
| Realistic violence | Infrequent / Mild |
| Prolonged graphic or sadistic realistic violence | None |
| Profanity or crude humor | None |
| Mature or suggestive themes | None |
| Horror or fear themes | None |
| Medical or treatment information | None |
| Alcohol, tobacco, or drug use | None |
| Simulated gambling | None |
| Sexual content or nudity | None |
| Contests | None |
| Unrestricted web access | No |
| User-generated content | No |
| Messaging and chat | No |
| Advertising | No |

Unrestricted web access is No because the in-app page stays on movementizer.com and www.movementizer.com. Other http and https links open in Safari.

## Privacy nutrition label

Answer from the code in this repo, not from a template.

Tracking: No. There is no advertising ID, no App Tracking Transparency prompt, and no analytics SDK.

Data the publisher does not receive from the app:

- No account, name, email, or phone number.
- No precise or coarse location.
- No contacts, photos, camera, or microphone. The app does not ask for those permissions.
- No purchases.
- No health or financial data.
- The website does not set cookies and does not use localStorage or sessionStorage.
- The Alerts switch stores two things on the phone only (AsyncStorage): whether alerts are on, and the last public status of each window. Agreeing to the terms stores the terms date on the phone only. None of that is uploaded. It does not need its own nutrition-label row if it never leaves the device.

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

Use the Device ID row for the IP address in the host log. Do not mark the data as used for tracking. Do not choose "Data Not Collected" for the whole app. Third-party requests (fonts, photos, YouTube) are covered by naming those partners if Connect asks for them. Purposes other than App Functionality (Third-Party Advertising, Developer's Advertising, Analytics, Product Personalization) are No.

## Export compliance

`ITSAppUsesNonExemptEncryption` is false. The app uses HTTPS only. In the export questionnaire, answer that the app does not use non-exempt encryption.

## Review notes

Paste this into App Review Information. Sign-in is not required. There is no demo account.

```
No account and no sign-in.

The app is a native shell around https://movementizer.com. Pages on movementizer.com and www.movementizer.com stay in the app. The first launch is a welcome screen with Terms, Privacy, and I agree. Terms and Privacy open in the app, and Back or a left-edge swipe returns to that screen. The agreement is saved on the phone. It is asked again only if the terms change. After I agree, the radar opens. There is no account, no sign-up, and no purchase. Privacy, Terms, and Support are in the app bar under the title. They are not repeated on the page. A tab bar at the bottom opens Radar, Live, Still on, Fulfilled, and Alerts. Live can be empty when nothing is in the street. Back on the bar returns to the previous page. A swipe from the left edge does the same as Back. Each legal page also has Back to the radar. News links, photo credits, and YouTube watch links open in Safari. A YouTube embed plays inside the window only after the reader presses play.

Airplane mode: the app shows a native offline screen with Retry. Pull down on the radar to refresh. The Alerts tab still opens.

Open any movement and tap Share. That opens the iOS share sheet. The app does not keep a record of the share.

Alerts is the last tab. It is off by default. Turning it on asks for notification permission and saves the current public Live / Still on / Fulfilled labels on the device. The next time the app is opened, a local notification can appear if one of those labels changed. Nothing is checked while the app is closed. There is no push server.

Record and Upload are not in this build. Nothing is sent to the Internet Archive or to Filecoin.

Contact: hridaya.8888@gmail.com
```

## Build and submit

From the `mobile/` directory, after the human steps below:

```
npx eas-cli@latest build -p ios --profile production --auto-submit
```

`eas.json` uses the production profile (`distribution: store`). `cli.appVersionSource` is `local` and `autoIncrement` is false, so the binary uses `ios.buildNumber` `3` from `app.json` and EAS does not bump it. With `remote`, that field is ignored, which is why this build does not use the remote counter. `ios.appleTeamId` and `submit.production.ios.appleTeamId` are `SMUWVBRUJ5` (KHARD HRIDAYA Inc., the organization team). `submit.production.ios.ascAppId` is `6826421935`. The EAS project id is `80ff33dc-e239-4ab1-889f-96c6f99b6e41` under the Expo owner `khardhridaya`.

## Steps a person has to do

1. Sign in to Expo as the owner `khardhridaya` (`npx eas-cli@latest login` from `mobile/`, or set `EXPO_TOKEN` for that account). The project id is already in `app.json`. Do not run `eas init` again and do not invent a project id.
2. The Apple Developer membership is the organization KHARD HRIDAYA Inc., Team ID `SMUWVBRUJ5`. The bundle id is `com.khardhridayainc.movementizer`. Credentials from the old individual team will not sign this build.
3. The App Store Connect app already exists. Its Apple ID is `6826421935`. Build 2 is already uploaded. This build is number 3. Do not let EAS auto-increment it.
4. `ascAppId` and `appleTeamId` are already set in `mobile/eas.json`. Do not put an API key or a token in the repo.
5. Paste the listing, keywords, age-rating answers, privacy answers, and review notes from this file. Set the support, privacy, and marketing URLs in the table above.
6. Add screenshots. This repo was prepared on a machine with no iOS Simulator, so the screenshots are not included. App Store Connect will ask for the sizes. Plan on the 6.9-inch iPhone set (1320 x 2868) or the 6.7-inch set (1290 x 2796), plus a 13-inch iPad set (2064 x 2752) because `supportsTablet` is true. Use the sizes Connect lists that day.
7. From `mobile/`, run the build command above. It needs an Expo login for `khardhridaya` and an App Store Connect API key (issuer id, key id, and the .p8 file) that can submit to team `SMUWVBRUJ5` and app `6826421935`. EAS will also need a distribution certificate and provisioning profile for that organization team.
8. The public website keeps Privacy, Terms, and Support in the footer only. The app hides that footer row. Ship the website when you want the live pages to match.
