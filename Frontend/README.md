# AI Agent Frontend

This project is a minimal example of an AI Agent that features 3D avatar interaction, responsive UI, and voice inputs / outputs. The frontend service is designed to be used with the AI Agent Backend Service.


### _[Backend Service]("https://github.com/muadao/AI-Agent-Backend-Service") is required to run this project. And the project is appended as submodule._

## Requirements
* Any device that can run `Node.js` and `npm`.
* A modern web browser that supports `WebGL`
* A microphone for voice input (Optional)
* API Key for [OpenAI API]("https://openai.com/index/openai-api/") (Paid)
* API Key and User ID for [Play.ht API]("https://play.ht/") (Paid)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Customize
### Use any GLTF file
This project uses the `glTF` format for the avatar. You can use any glTF file by replacing the `avatar.glb` file in the `public/models` directory.

However, there are some requirements if animations are meant to be used:
1. Make sure the animations' names match the code.

    Clip names are used only in `3d.ts`, and are triggered by events. 
2. Vertex animations are not supported.

If your GLTF file causes issues, it's very likely that comment out the codes in `3d.ts` that are related to animations will fix the issue.
### Replace icons and Images
Some icons are inlined svg, and some are images. Images can be replaced in the `public/assets` directory.