---
date: 2025-05-15T16:17:43.003Z
draft: true
params:
  author: Oleg Pustovit
title: "In 2025, Apple still makes it hard to play your own MP3s, so I wrote my own app"
weight: 10
tags:
  - swift
  - ios
  - apple
  - xcode
---

# In 2025, Apple still makes it hard to play your own MP3s, so I wrote my own app

> In 2025, playing your own MP3s on an iPhone is surprisingly hard, unless you pay Apple or navigate a maze of limitations. So I built my own player from scratch, with full text search, iCloud support and local-first experience. [GitHub link](https://github.com/nexo-tech/music-app)

## Why I Built My Own MP3 Player

Like many people, I've picked up too many subscriptions, some through Apple (iCloud, Apple Music), others got lost in random platforms (like Netflix, which I forgot I was still paying for). I actually used Apple Music regularly (and previously Spotify), but the streaming turned out to be more convenience than necessity. With a curated local library, I didn't lose much, just the lock-in.

I had an Apple Music subscription and I saw that they have a an iCloud music sync — you put your music to your iTunes library and it gets synced across devices. Alas, shortly after cancelling my subscription I discovered that this functionality doesn’t work without active service subscription, so I reduced my problem to the next thing — have my library of music stored in iCloud and stream the music from cloud so I could play it from multiple devices. Sure, Apple provides standalone service called iTunes Match ($24.99 a year), but it has downsides of replacing audio-files when songs are matched and you're tied to iTunes, which is quite archaic piece of software these days.

While being frustrated with lack of options I decided to go hacker/builder route. If I bought a computing device (iPhone in this case), what stops me just to build exactly what I need with code to use it. In this article I want to share my full of frustrations journey towards creating a basic music player functionality — loading MP3 files, organizing and playing them back, but still encourage more talented people to keep using their computer technology as means to create, not just consume.

## What Apple (and Others) Offer Today

Before writing my own app, I explored the official and third-party options for offline music playback.

### Apple's Built-in Apps

Apple gives you a “great” app to play your music — Files. Files app is definitely missing on too many things: you cannot create playlists, organize your music the way you want. I feel they made it so you can at least play your songs but it’s definitely not a good user experience to use.

### Third-Party Apps

I went to the app store to look for cool apps that solve my problem — while there are many of them, many are using subscription based pricing (which is pretty weird for a music player that plays your music). There’s one app that I liked — Doppler, I’ve played with it during trial, but the UX is built around managing albums, search wasn’t that good and import functionality from iCloud was slow and hard to use on large number of nested folders. The upside was — it had a single payment pricing model.

## Going Builder Mode: My Technical Journey

With that said, I decided to create my own ideal music player that solves my pain points:

- Flexible full text search across iCloud folders, so I can select and import a folder with music or specific files quickly
- Functionality in managing music at least on par with official Music App — queue, playlist management and sorting by albums etc.
- Familiar and friendly interface

### Trying React Native First

I’m not a Swift person, I had experience working with Swift, and honestly I didn’t enjoy it much — the language felt very similar to Typescript (in terms of syntax) and Rust (in terms of certain semantics), but due to its ergonomics, tied ecosystem to Apple, things like lack of async/await it never sticked to me.

For my application I went with React Native or Expo, my plan was to find a tutorial with a complete player UI and insert cloud syncing functionality with library management. While getting some player app was easy enough (because there were many of such on the internet), implementing simple cloud access proved to be painful.

Apple designed a secure way to access files outside of app container, while you can let the user to access external folders, the app receives only temporary access (after user explicitly selected a specific folder). I understand the security considerations and having designed such safety precautions on operating system level is cool, but unfortunately this increasingly complicates things for someone who wants to hack together some piece of code that a trillion dollar company failed to do.

### React Native Limitations and Filesystem Pain

I played with libraries like `expo-filesystem`, they do support file picking, but the recursive file traversal and other things (that are probably less intended for those libraries) numerous times crashed my development app, so I gave up on writing the app in familiar to be React Native

### Switching to SwiftUI

I know that nowadays people try to use SwiftUI instead of IBActions and storyboards, after all making declarative, code only UIs is much simpler than battling MVC-like patterns and establishbing UI bindings between UI kit storyboards and code.

I did few official tutorials on Apple website, and found that after all they have improved language a lot (added async/await), simplified syntax for building declarative UIs, so I thought to take the plunge and get into writing my app native.

## App Architecture and Data Model

Let's go over architecture of the app I've created: I used SQLite for persistent data storage and approached the app architecture as a simple server application. Later I also discovered that built-in SQLite contains full-text search capabilities and that's exactly what I needed.

### Three Main Screens

**The app consist of 3 screen/modes:**

1. **Library import.** This is where you add your iCloud library folder. The app scans every folder for mp3 file and inserts every path into SQLite database. This way you can have full flexibility in searching, adding folders, subfolders. Apple's Native file picker is very clunky — you cannot select multiple directories that you searched by key word and then also a bunch of files in one go. It simply is not designed to do that.
2. **Library management**. This is where you can manage the added songs and organize playlists. For the most part I've reflected the way Apple did that in their Music app and it was good enough for my needs.
3. **Player and playback**. This part of application manages queue management (repeat, shuffle) etc and play, stop, next song functionality.

A simple user flow diagram is shown here:

\<diagram image here>

### Backend-Like Logic Layer

Having a web/cloud background and shipped a lot of server code while working in startups I went with backend-like architecture of mobile app. The whole domain/logic layer was separated from View and View-Model layer because I had to nail the cloud syncing, metadata parsing aspect of the app and having a clean data access to SQL lite DB.
Since I also relied a lot on LLMs (thanks OpenAI o1 and DeepSeek) separating domain logic and aggregate classes of various music player entities forced LLM not to include UI independed code inside Views and View Models, thus it saved me time to keep things organized. Here's an approximate layered architecture diagram that I used here:

\<diagram image here>

I worked the most on domain side of things, I had to write SQL table setup and queries that do full text search and then relay the data back to the View-Model layer that is shown by Views.

## Implementing Full Text Search with SQLite

Like I previously mentioned, it's fortunate that you can import an SQLite version with fts capabilities: since iOS 11 Apple added compile flag `SQLITE_ENABLE_FTS5`, so I have FTS5 enabled out of the box. Additionally, I used SQLite.swift library for regular queries (which works as sort of query builder with compile-time safety), however for FTS queries I had to reserve to the regular SQL statements.

SQLite’s FTS5 extension ended up being one of the most valuable pieces of the architecture. I wanted fast, fuzzy search over my local music library and file system paths — across filenames and metadata (title/artist/album)

### Setting Up the FTS Tables

I created _two_ FTS5 tables, each tuned for a different query surface:

| Domain               | Swift actor / repo                 | FTS5 table         | Columns that get indexed                  |
| -------------------- | ---------------------------------- | ------------------ | ----------------------------------------- |
| Library songs        | `SQLiteSongRepository`             | `songs_fts`        | `artist`, `title`, `album`, `albumArtist` |
| Source-browser paths | `SQLiteSourcePathSearchRepository` | `source_paths_fts` | `fullPath`, `fileName`                    |

Both tables live next to the primary rows in plain‐old B-tree tables (`songs`, `source_paths`). FTS is **read-only for the UI**; all writes happen inside the repositories so nothing slips through the cracks. I used unicode61 tokenizer to ensure that wide variety of characters are handled. Non searchable keys are flagged with `UNINDEXED`, so they don't bloat the term dictionary.
Here’s your simplified and concise replacement (after the FTS tables), keeping the article clear but less technical:

---

#### Creating the search index

SQLite’s built-in FTS5 makes quick searches easy. Here’s a simple table definition I used:

```swift
try db.execute("""
CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
  songId UNINDEXED,
  artist, title, album, albumArtist,
  tokenize='unicode61'
);
""")
```

#### Updating data reliably

To keep things simple and safe, I wrapped updates and inserts in transactions. This ensures the search index never gets out of sync, even if the app crashes or gets interrupted.

```swift
func upsertSong(_ song: Song) async throws {
    db.transaction {
        // insert or update main song data
        // insert or update search index data
    }
}
```

### Querying with Fuzzy Search

For user-friendly search, I add wildcard support automatically. If you type "lumine," it searches for "lumine\*" internally, giving instant results even with partial queries.

I also leverage SQLite’s built-in smart ranking (`bm25`) to return more relevant results without extra complexity:

```sql
SELECT s.*
FROM songs s JOIN songs_fts fts ON s.id = fts.songId
WHERE songs_fts MATCH ?
ORDER BY bm25(songs_fts)
LIMIT ? OFFSET ?;
```

_(For those curious about the deeper technical details or who want exact implementations, check the [full source on GitHub](https://github.com/nexo-tech/music-app).)_

## Working with iOS Files and Bookmarks

Apple provides security-scoped bookmarks as stable references to files outside the app’s sandbox. Normally these bookmarks remain valid indefinitely, as long as the files aren’t moved outside the app’s original security context. However, bookmarks occasionally become invalidated due to sandbox changes or incorrect bookmark handling (e.g., failing to call `startAccessingSecurityScopedResource()`). To mitigate this, I implemented a fallback mechanism that copies files into the app’s own sandboxed container. See [Apple’s bookmark documentation](https://developer.apple.com/documentation/foundation/nsurl#1664002).

As a solution I had to come up with a clever way to keep the library import process quick: I would still use security scoped bookmarks that are serialized and stored in the SQLite database, but I will also run background sync process that will copy music files onto application filesystem container while the bookmark is still valid. I was able to get persistent bookmark access to the folder (to traverse the child directories, however being able to play files via saved bookmarks for the time being is an unsolved problem for me), unfortunately the internet doesn't have a lot of info on that.

## Building the Playback and UI

### Metadata Parsing

Fortunately for parsing audio files you need to load `AVURLAsset` file and look into its metadata, while metadata parsing is already handled by SDK, certain fields like track numbers you have to manually look up from ID3 tags, I found some of the examples on how to do it via [GitHub search](https://github.com/TastemakerDesign/Warper/blob/2af8c07ad8422f4dc3a539177d3a76ee8502e632/plugins/flutter_media_metadata/ios/Classes/Id3MetadataRetriever.swift) (again because the API isn't very in-depth how to parse edge cases in audio files).

### Audio Playback with AVFoundation

Once there's a library access and read of audio files, implementing audio player feels pretty simple: you just have to initialise instance of `AVAudioPlayer` and let the audio playing. Additionally for quality of life features: playing music from control center, I had to implement `AVAudioPlayerDelegate` protocol and provide `MPRemoteCommandCenter` commands.

## Reflections: Apple, Developer Lock-In, and the Future

To summarize my experience with development process, I want to highlight the following things:

### The Bad

**XCode**. I hated it, back when I ported my C++ code to macOS, its capabilities were nowhere close to Microsoft's Visual Studio, now with Swift — it feels that things got better with real-time previews, but the development experience feels nowhere as good compared to what Google showed with Flutter five years ago — a tight integration with VSCode that updated simulator in real-time with complete familiar to developers debugger.

**Not straightforward LSP configuration**. If you want to use something like neovim with LSPs or VSCode (or one of their popular AI-coding forks), you need to look for some custom configurations to have complete LSP support for UI kit. Get `xcode-build-server` it's pretty simple to set up.

**Modern Swift API still in certain cases lacks functionality and you need to opt out to old Objective-C bindings**. I faced this issue when I played with NSQueries to find files in the filesystem, you would have to learn "old-school" patterns and learn whole next level of complexity of Objective C legacy baggage. Of course, it's not a problem for seasoned OS X/iPhone OS developers, but for someone who gets started it's a large roadblock. More frustrating is, the documentation often lacks on obscure APIs and there are not many explanations online how to use certain things. I would say the same about parsing ID3 tags for music files.

**SwiftUI’s declarative UI is great, but debugging iCloud interactions still requires manual mocks**. SwiftUI previews can’t emulate full app behaviors involving iCloud entitlements, so you have to mock cloud interactions manually, a minor annoyance but notable.

### The Good

**Async/await**. Finally, I can write IO bound concurrent code like an imperative one with no annoying callbacks. That's a big win and I greatly appreciate how easy it is to write even sync code into Actors and call it like you do in JavaScript ecosystems.

**Plethora of native libs**. Yes, you're not limited by open source bidings like in React Native/Flutter ecosystems. Here you have much more freedom in developing something "more serious" than you company/product website replacement (because of poor mobile-first experience), many cool Apple's APIs are available with examples and they are quite easy to get started using.

**SwiftUI** itself. Yes, the react-style approach to building UIs gives more productivity and space for explorations, it's just great that Apple adopted it.

### Summary: Building Should Be Easier

After 1.5 weeks of hacking around, I was able to get the piece of software which exactly satisfies my needs — a local/offline music player that can import mp3s from cloud storage.

But you quickly realize that you cannot simply deploy an app to the hardware you own this days and forget about it: you only get a week of app to work and after that you have to rebuild it, unless you paid $99 to Apple to enroll to development program. Unfortunately, even after DMA act in EU you still cannot sideload freely an app you've build unless you purchase 1 year provisioning profile or you only have 7 day one.

This makes ultimately no sense — an innovative technology company actively puts roadblocks into democatized application development. Not even talking about PWA — it feels that certain Safari feature set is artificially cripled: you have limited access to the hardware features and graphics API like WebGL simply don't produce the same high-fidelity graphics as the native APIs.

Nowadays, AI reduced the complexity of modern software development by allowing anyone to tackle unknown technologies by providing all the necessary knowledge in accessible way, you can clearly see how web development got more interest from non-technical people who have a way to build their ideas without specializing on plethora of technologies. But when it comes to mobile apps — you just have to play by the artificail rules. You cannot create an app, share it freely, it needs to be verified by Apple. How is the same company that opened the door for tech enthusiast to use personal computers and write applications for it, these days they do polar opposite and make it really hard to develop applications freely?
