# VEIL

A default-class messenger prototype: **text**, **async video messages**, and **live voice/video calls**.

This is the first slice of a product that could live on every phone — not because Apple or Google anoint it, but because the client is a PWA you can install, the media path is WebRTC, and the server is a router of envelopes, not a reader of letters.

## What works today (v0.1)

- Display-name join, presence, online roster
- 1:1 text with typing indicators and simple read receipts
- Photos / short video / audio attachments
- Record-in-place video messages
- 1:1 WebRTC voice and video calls (STUN; add a TURN server for nasty NATs)
- Installable PWA (Add to Home Screen)

## Run it

```bash
cd veil
python3 server.py
```

Open http://localhost:3000 in two browsers (or a phone on the same network using your machine’s LAN IP). Python 3.10+ stdlib only.

Repo: this file lives at the root. Clone, run, talk.

## Honest architecture

```
Client  --WebSocket-->  Signaling / chat router (this repo)
Client  --DTLS-SRTP-->  Peer (or TURN / SFU later)
```

The process never sees call media. Chat media in v0.1 is sent as data URLs over WebSocket so the prototype works with zero infra. Production replaces that with encrypted object storage and chunked upload.

See ROADMAP.md for the path toward a household default.
