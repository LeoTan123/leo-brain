## Introduction
Adapted from [this](https://www.youtube.com/watch?v=mkJbEP5GeRA) youtube tutorial from Coding in Flow.

Differences:
- Due to OpenAI free trial credits being discontinued, open source alternatives were used.
  * Replaced OpenAI API model `text-ada-002` with [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) model using [Transformers.js](https://huggingface.co/docs/transformers.js/en/index) to create embeddings locally
  * Replaced OpenAI API model `gpt-3.5-turbo` with [llama-2-7b-chat.Q4_K_M.gguf](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF) model using [llama.cpp](https://github.com/ggerganov/llama.cpp) web server to serve the model locally
- Store vector embeddings in [pgvector](https://github.com/pgvector/pgvector) locally using Docker instead of [Pinecone](https://www.pinecone.io/)
- Use Postgres database (pgvector) to store the notes instead of MongoDB

## Demo video
https://github.com/user-attachments/assets/072c721f-bb9a-4464-b243-97ebb82eb13b

## Setup
1. Firstly, clone the repository and install the dependencies
```bash
git clone https://github.com/LeoTan123/leo-brain.git
npm install
```

2. Next, install/download [llama.cpp](https://github.com/ggerganov/llama.cpp) and the [llama-2-7b-chat.Q4_K_M.gguf](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF) model. Then, serve the Llama 2 model using the llama.cpp web server with:
```bash
./llama-server -m models/llama-2-7b-chat.Q4_K_M.gguf
```

3. Create a .env file with the following variables
```
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/notes
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/notes

POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

4. Lastly, run the database and the project
```bash
docker compose up
npm run dev
```
(optional) run Prisma Studio to see the database data
```bash
npx prisma studio
```

<i>Last updated: 19 August 2024</i>

