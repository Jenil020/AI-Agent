<!--
title: 'Voice AI Agent Backend'
description: 'This is a minimal example of an AI agent backend service with voice inputs and outputs.'
layout: Doc
framework: v3
language: nodeJS
priority: 1
authorLink: 'https://github.com/muadao'
authorName: 'MUA DAO'
authorAvatar: 'https://avatars.githubusercontent.com/u/97941133?s=200&v=4'
-->

# Voice AI Agent Backend

This is a minimal example of an AI agent backend service which provides ASR, LLM, and TTS services. The backend service
is designed to be used with the GaiaNet platform, but can also be used with other compatible LLM services.

## Features

* __Easy to use__ :  Set some variables, and you are ready to go.
* __Scalable__ : No context stored, no database needed. 
* __Low Latency__ : Really quick response thanks to SSE and streaming APIs. 

## Configuration 
### Setup
Several environment variables are required to be set in the `.env` file. The following is an example of the required
environment variables:

```bash
# OpenAI API key for ASR service
OPENAI_API_KEY=sk-...

# Play.ht API key and user ID for TTS service
PLAYHT_API_KEY=...
PLAYHT_USER_ID=...

# The backend service will listen on this port
PORT=4242

# GaiaNet LLM service
LLM_SERVER="example.gaianet.network"
# Make sure to set the correct model for the LLM service
MODEL="Llama-3-8B-Instruct"

# Agent specific configurations
SYS_PROMPT="You're an expert in Web3. Try to answer what the user is asking in a simple way."
# Voice clone ID for TTS service
VOICE_CLONE_ID=""
```

### Customize the knowledgebase
The knowledgebase is not stored locally on the server, it's instead retrieved by the Gaianet Node's inner API.
So, if you need to customize the knowledgebase, you can deploy your own [Gaianet Node]("https://github.com/GaiaNet-AI/gaianet-node").  
## Compatibility

The default backend service is designed to be used with the GaiaNet platform.
However, as GaiaNet applies to the OpenAI API, it's actually independent of GaiaNet and can be used with other
compatible LLM services.

To use the backend service with another LLM service, simply change the value of ```LLM_SERVER```
in ```.env``` to a compatible LLM service URL.