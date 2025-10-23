# Paint-A-Hike 🎨 🏔️
![paintahike+(1)+(1) (1)](https://github.com/user-attachments/assets/379f16a7-5e55-4095-a72a-eaa18d50af3f)

<p style="font-size: 0.2em;">This was built in 24 hours for the DubHacks 2025 hackathon.</p>

## What It Does
Our web app finds your dream outdoor scenery in the real world. After you make a rough sketch of your ideal location, our web app makes your imagination come to life and gives you the perfect location to visit. It's a perfect app for people who love nature and hiking, along with photographers who are looking for specific scenery to capture. With a simple, intuitive UI and easy user access, it's the perfect way to find whatever scenery you dreamt of.

<img width="1516" height="986" alt="paint-a-hike3" src="https://github.com/user-attachments/assets/74f13758-26e1-49d6-992b-6e5cbab08a5a" />
<h1 align="center">↓</h1>
<img width="1516" height="986" alt="paintresult" src="https://github.com/user-attachments/assets/04e8de70-4f89-4cec-a811-b4467678f157" />

## How to Run it

In one terminal window under the `paint-a-hike/next-js-frontend/` directory, run

    npm run dev

to serve the frontend.

In another terminaml window, run 

    python server.py

in the root `pain-a-hike` directory to serve the backend.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## My Primary Contributions

- **Backend Architecture & Development**: Designed and implemented the entire Python backend, including the hybrid search algorithm combining SegFormer mIOU scores with CLIP/Gemini text-embedding similarity.

- **Frontend Development**: Built the frontend UI for the results page, results page using Next.js, TypeScript, and Framer-motion.

- **API Integration**: connected the front-end and the back-end using  FastAPI, utilizing it to send user inputs and model results between the front and back-end servers.

- **Model Integration**: Wrote the data pipelines to pre-process database images with SegFormer and CLIP and built the API endpoints to run live inference with Gemini.

## How it Works

The core of this project is a hybrid search system that scores potential images based on two criteria: **spatial layout (what) and semantic context (what's next to what)**.


#### Offline: Database Pre-processing

Before any search, our image database is pre-processed:

1. Semantic Segmentation: Each image is run through a SegFormer model to generate a segmentation map. This labels every pixel as "mountain," "lake," "sky," etc.

2. CLIP Embeddings: Each image is also processed by CLIP to generate a vector embedding that captures its visual content.

#### Online: Live Search Query

When a user submits a sketch, a multi-stage process begins:

1. User Input: The user's sketch is a simple, color-coded segmentation map (e.g., blue for "lake," gray for "mountain").

2. Score 1: Segmentation (mIOU): We calculate the Intersection Over Union (mIOU) between the user's sketch-map and the pre-computed SegFormer maps from our database. This provides a score based on matching shapes and locations.

3. Score 2: Context (CLIP + Gemini):
  - The user's sketch is sent to Gemini to generate a descriptive text prompt (e.g., "A mountain over a lake").
  - This text prompt is converted into a CLIP text embedding.
  - We calculate the Cosine Similarity between the user's text embedding and the database images' pre-computed CLIP embeddings.

4. Final Ranking: A weighted score is calculated by combining the mIOU score (spatial accuracy) and the Cosine Similarity score (contextual accuracy). This hybrid score is used to rank and return the most relevant images to the user.

